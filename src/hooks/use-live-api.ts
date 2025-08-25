
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Part } from '@google/genai';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext } from '@/lib/utils';
import { MultimodalLiveClient } from '@/lib/multimodal-live-client';

export interface UseLiveAPIResults {
  client: MultimodalLiveClient | null;
  connected: boolean;
  text: string;
  error: string | null;
  isSpeaking: boolean;
  isListening: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (parts: Part | Part[]) => void;
  stream: MediaStream | null;
}

export function useLiveAPI(): UseLiveAPIResults {
  const clientRef = useRef<MultimodalLiveClient | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);

  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleAudio = useCallback((data: ArrayBuffer) => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.addPCM16(new Uint8Array(data));
    }
  }, []);

  const handleContent = useCallback((content: any) => {
    const modelTurn = content.modelTurn || content.groundingResponse;
    if (modelTurn) {
        const parts = modelTurn.parts || [];
        const textPart = parts.find((p: any) => 'text' in p);
        if (textPart) {
            setText(prev => prev + textPart.text);
        }
    }
  }, []);
  
  const handleTurnComplete = useCallback(() => {
    setText('');
  }, []);

  const stopListening = useCallback(() => {
    if (scriptProcessorNodeRef.current && sourceNodeRef.current && inputAudioContextRef.current) {
        scriptProcessorNodeRef.current.disconnect();
        sourceNodeRef.current.disconnect();
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        setStream(null);
    }
    setIsListening(false);
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;

    stopListening();

    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
      audioStreamerRef.current = null;
    }
    setConnected(false);
    setText('');
    setError(null);
    setIsSpeaking(false);
  }, [stopListening]);


  const startListening = useCallback(async () => {
    if (!clientRef.current || !clientRef.current.ws) {
        setError("Not connected to the server.");
        return;
    }
    if (isListening) return;

    try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        mediaStreamRef.current = userMediaStream;
        setStream(userMediaStream);
        
        const inputCtx = await audioContext({id: 'audio-in', config: {sampleRate: 16000}});
        inputAudioContextRef.current = inputCtx;

        sourceNodeRef.current = inputCtx.createMediaStreamSource(userMediaStream);
        const bufferSize = 256;
        scriptProcessorNodeRef.current = inputCtx.createScriptProcessor(bufferSize, 1, 1);

        scriptProcessorNodeRef.current.onaudioprocess = (event) => {
            const pcmData = event.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
                int16[i] = pcmData[i] * 32768;
            }
            clientRef.current?.sendRealtimeInput([{
                mimeType: 'audio/pcm;rate=16000',
                data: Buffer.from(int16.buffer).toString('base64'),
            }]);
        };
        
        sourceNodeRef.current.connect(scriptProcessorNodeRef.current);
        scriptProcessorNodeRef.current.connect(inputCtx.destination);

        setIsListening(true);
    } catch(e) {
        console.error("Microphone/camera access denied:", e);
        setError("Microphone and camera access are required to use this feature.");
    }

  }, [isListening]);


  const connect = useCallback(async () => {
    if (clientRef.current) {
      return;
    }
    setError(null);
    setText('');

    const client = new MultimodalLiveClient({
      url: `wss://studio-api.fexwork.com/proxy/gemini-live`,
    });
    clientRef.current = client;

    client.on('open', async () => {
      setConnected(true);
      if (!audioStreamerRef.current) {
        const audioCtx = await audioContext({ id: "audio-out" });
        const streamer = new AudioStreamer(audioCtx);
        streamer.onStart = () => setIsSpeaking(true);
        streamer.onComplete = () => setIsSpeaking(false);
        audioStreamerRef.current = streamer;
      }
      startListening();
    });

    client.on('close', () => disconnect());
    client.on('error', (e: any) => {
        console.error('Live API Error:', e);
        setError('An error with the live connection occurred.');
        disconnect();
    });
    client.on('audio', handleAudio);
    client.on('content', handleContent);
    client.on('turncomplete', handleTurnComplete);
    client.on('interrupted', () => {
        setText('');
        audioStreamerRef.current?.stop();
    });

    try {
        await client.connect();
    } catch(e: any) {
        console.error('Failed to connect to Live API:', e);
        setError(e.message || 'Failed to initialize the API client.');
        disconnect();
    }
  }, [disconnect, handleAudio, handleContent, handleTurnComplete, startListening]);


  const send = useCallback((parts: Part | Part[]) => {
    if (clientRef.current) {
        setText('');
        clientRef.current.send(parts);
    }
  }, []);

  return {
    client: clientRef.current,
    connected,
    text,
    error,
    connect,
    disconnect,
    send,
    stream,
    isSpeaking,
    isListening,
  };
}
