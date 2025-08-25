
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveConnectConfig, Part } from '@google/genai';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext } from '@/lib/utils';
import { base64ToArrayBuffer } from '@/lib/utils';

// You might need to adjust the export based on the file you just provided.
// I'm assuming it should be this for now.
export interface UseLiveAPIResults {
  session: LiveSession | null;
  connected: boolean;
  text: string;
  error: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  // Renamed for clarity: these functions now control turns, not the stream.
  startListening: () => void;
  stopListening: () => void;
  send: (parts: Part | Part[]) => void;
  stream: MediaStream | null;
}

export function useLiveAPI(): UseLiveAPIResults {
  const sessionRef = useRef<LiveSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    audioStreamerRef.current?.stop();
    setStream(null);
    setConnected(false);
    setText('');
    setError(null);
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  const connect = useCallback(async () => {
    if (sessionRef.current) {
      return;
    }
    setError(null);
    setText('');

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      setError("API key is not configured.");
      return;
    }

    try {
      // Initialize the audio output streamer.
      if (!audioStreamerRef.current) {
        const audioCtx = await audioContext({ id: "audio-out", config: { sampleRate: 24000 } });
        audioStreamerRef.current = new AudioStreamer(audioCtx);
      }
      // Resume the audio context in case it was suspended.
      if (audioStreamerRef.current.context.state === 'suspended') {
        await audioStreamerRef.current.resume();
      }
      
      // Get the microphone and camera stream from the user.
      const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaStreamRef.current = userMediaStream;
      setStream(userMediaStream);

      const genAI = new GoogleGenAI({ apiKey });
      
      // Provide the stream directly to the connect method.
      // The library will handle all the necessary audio encoding and processing.
      const newSession = await genAI.live.connect({
        model: 'gemini-live-2.5-flash-preview',
        config: {
          audio: {input: {encoding: 'LINEAR16', sampleRateHertz: 16000}, output: {encoding: 'LINEAR16', sampleRateHertz: 24000}},
          video: {input: {encoding: 'H264'}},
          text: {},
        },
        // Pass the stream here.
        stream: userMediaStream,
        callbacks: {
          onopen: () => setConnected(true),
          onclose: () => disconnect(),
          onerror: (e) => {
            console.error('Live API Error:', e);
            setError('An error with the live connection occurred.');
            disconnect();
          },
          onmessage: (message) => {
            if (message.serverContent) {
              if ('interrupted' in message.serverContent) {
                audioStreamerRef.current?.stop();
                setText('');
              } else if ('modelTurn' in message.serverContent) {
                setIsSpeaking(true);
                const parts = message.serverContent.modelTurn?.parts || [];
                parts.forEach(part => {
                  if ('text' in part) {
                    setText(prev => prev + part.text);
                  } else if (part.inlineData?.mimeType?.startsWith("audio/")) {
                    const audioData = base64ToArrayBuffer(part.inlineData.data);
                    audioStreamerRef.current?.addPCM16(new Uint8Array(audioData));
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
  }, [disconnect]);

  const send = useCallback((parts: Part | Part[]) => {
    if (sessionRef.current) {
      // Correctly format the data as a Content object.
      sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: Array.isArray(parts) ? parts : [parts] }] });
    }
  }, []);

  const startListening = useCallback(() => {
    if (sessionRef.current && connected && !isListening) {
      setText('');
      setIsListening(true);
      // Correctly send a message to start the user's turn without being 'complete'.
      sessionRef.current.sendClientContent({ turns: [], turnComplete: false });
    }
  }, [connected, isListening]);

  const stopListening = useCallback(() => {
    if (sessionRef.current && connected && isListening) {
      setIsListening(false);
      // Correctly send a message to mark the user's turn as 'complete'.
      sessionRef.current.sendClientContent({ turns: [], turnComplete: true });
    }
  }, [connected, isListening]);

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
