
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveConnectConfig, Part } from '@google/genai';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext } from '@/lib/utils';
import VolMeterWorklet from '@/lib/worklets/vol-meter';
import { base64ToArrayBuffer } from '@/lib/utils';
import { defaultVoice, VoiceKey } from '@/lib/config/voice-mapping';

export interface UseLiveAPIResults {
  session: LiveSession | null;
  connected: boolean;
  text: string;
  error: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => void;
  stopListening: () => void;
  send: (parts: Part | Part[]) => void;
  stream: MediaStream | null;
}

export function useLiveAPI(): UseLiveAPIResults {
  const sessionRef = useRef<LiveSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stopAudioPlayback = useCallback(() => {
    outputAudioStreamerRef.current?.stop();
    setIsSpeaking(false);
  }, []);
  
  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    
    stopListening();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    
    stopAudioPlayback();
    if(outputAudioStreamerRef.current) {
        outputAudioStreamerRef.current = null;
    }

    setStream(null);
    setConnected(false);
    setText('');
    setError(null);
  }, [stopAudioPlayback]);

  const connect = useCallback(async () => {
    if (sessionRef.current) {
      return;
    }
    setError(null);
    setText('');

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError("API key is not configured.");
      return;
    }

    try {
      if (!outputAudioStreamerRef.current) {
        const audioCtx = await audioContext({ id: "audio-out", config: { sampleRate: 24000 } });
        outputAudioStreamerRef.current = new AudioStreamer(audioCtx);
      }

      const genAI = new GoogleGenAI({ apiKey });
      const newSession = await genAI.live.connect({
        model: 'gemini-live-2.5-flash-preview',
        config: {
          audio: {input: {encoding: 'LINEAR16', sampleRateHertz: 16000}, output: {encoding: 'LINEAR16', sampleRateHertz: 24000}},
          video: {input: {encoding: 'H264'}},
        },
        callbacks: {
          onopen: () => setConnected(true),
          onclose: () => disconnect(),
          onerror: (e) => {
            console.error('Live API Error:', e);
            setError('An error occurred with the live connection.');
            disconnect();
          },
          onmessage: (message) => {
            if (message.serverContent) {
              if ('interrupted' in message.serverContent) {
                stopAudioPlayback();
                setText('');
              } else if ('modelTurn' in message.serverContent) {
                setIsSpeaking(true);
                const parts = message.serverContent.modelTurn?.parts || [];
                parts.forEach(part => {
                  if ('text' in part) {
                    setText(prev => prev + part.text);
                  } else if (part.inlineData && part.inlineData.mimeType?.startsWith("audio/")) {
                    const audioData = base64ToArrayBuffer(part.inlineData.data);
                    outputAudioStreamerRef.current?.addPCM16(new Uint8Array(audioData));
                  }
                });
              } else if ('turnComplete' in message.serverContent) {
                setIsSpeaking(false);
              }
            } else if (message.clientContent?.turns?.some(t => 'text' in t && t.text)) {
              setText('');
            }
          },
        },
      });
      sessionRef.current = newSession;
    } catch (e: any) {
      console.error('Failed to initialize or connect to Live API:', e);
      setError(e.message || 'Failed to initialize the API client.');
      disconnect();
    }
  }, [disconnect, stopAudioPlayback]);

  const send = useCallback((parts: Part | Part[]) => {
    if (sessionRef.current) {
      sessionRef.current.sendClientContent({ turns: Array.isArray(parts) ? parts : [parts] });
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening || !connected) return;
    
    try {
        if (!inputAudioContextRef.current || inputAudioContextRef.current.state === 'closed') {
            inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 16000});
        }
        await inputAudioContextRef.current.resume();

        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        mediaStreamRef.current = mediaStream;
        setStream(mediaStream);

        const sourceNode = inputAudioContextRef.current.createMediaStreamSource(mediaStream);
        const scriptProcessorNode = inputAudioContextRef.current.createScriptProcessor(256, 1, 1);

        scriptProcessorNode.onaudioprocess = (event) => {
            if (!isListening) return;
            const pcmData = event.inputBuffer.getChannelData(0);
            sessionRef.current?.sendRealtimeInput({ media: { data: pcmData, mimeType: 'audio/pcm' } });
        };

        sourceNode.connect(scriptProcessorNode);
        scriptProcessorNode.connect(inputAudioContextRef.current.destination);
        
        sourceNodeRef.current = sourceNode;
        scriptProcessorNodeRef.current = scriptProcessorNode;

        setIsListening(true);
        setText('');

    } catch (e) {
        console.error("Failed to start listening:", e);
        setError("Could not get microphone access.");
    }
  }, [isListening, connected]);

  const stopListening = useCallback(() => {
    if (!isListening) return;

    setIsListening(false);
    
    if (scriptProcessorNodeRef.current) {
        scriptProcessorNodeRef.current.disconnect();
        scriptProcessorNodeRef.current.onaudioprocess = null;
        scriptProcessorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        setStream(null);
    }
  }, [isListening]);
  
  useEffect(() => {
    // This effect ensures isListening is correctly updated when stopListening is called
    if (scriptProcessorNodeRef.current) {
        scriptProcessorNodeRef.current.onaudioprocess = (event) => {
            if (!isListening) return;
            const pcmData = event.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
                int16[i] = pcmData[i] * 32768;
            }
            sessionRef.current?.sendRealtimeInput({ media: { data: new Uint8Array(int16.buffer), mimeType: 'audio/pcm' } });
        };
    }
  }, [isListening]);


  return { 
    session: sessionRef.current,
    connected, 
    text,
    error, 
    connect, 
    disconnect, 
    send,
    stream,
    isListening,
    startListening,
    stopListening,
    isSpeaking,
  };
}
