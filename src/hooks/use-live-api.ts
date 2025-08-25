
'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, LiveSession, Part } from '@google/genai';
import { base64ToArrayBuffer } from '@/lib/utils';

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
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const disconnect = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    audioContextRef.current = null;

    setStream(null);
    setConnected(false);
    setText('');
    setError(null);
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    
    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch(e) {
      console.error("Error decoding or playing audio:", e);
      setError("Failed to play audio response.");
    }
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
      const genAI = new GoogleGenAI({ apiKey });
      const newSession = await genAI.live.connect({
        model: 'gemini-live-2.5-flash-preview',
        config: {
          audio: {input: {encoding: 'LINEAR16', sampleRateHertz: 16000}, output: {encoding: 'LINEAR16', sampleRateHertz: 24000}},
          video: {input: {encoding: 'H264'}},
          text: {},
        },
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
                setText('');
              } else if ('modelTurn' in message.serverContent) {
                setIsSpeaking(true);
                const parts = message.serverContent.modelTurn?.parts || [];
                parts.forEach(part => {
                  if ('text' in part) {
                    setText(prev => prev + part.text);
                  } else if (part.inlineData?.mimeType?.startsWith("audio/")) {
                    const audioData = base64ToArrayBuffer(part.inlineData.data);
                    playAudio(audioData);
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
  }, [disconnect, playAudio]);

  const startListening = useCallback(async () => {
    if (!sessionRef.current || !connected) {
      setError("Not connected to the API.");
      return;
    }
    if (isListening) return;

    try {
        setText('');
        const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        mediaStreamRef.current = userMediaStream;
        setStream(userMediaStream);

        sessionRef.current.sendClientContent({stream: userMediaStream});
        setIsListening(true);
    } catch (e) {
      console.error("Microphone/camera access denied:", e);
      setError("Please allow microphone and camera access.");
    }
  }, [connected, isListening]);

  const stopListening = useCallback(() => {
    if (sessionRef.current && connected && isListening) {
        sessionRef.current.sendClientContent({ turns: [], turnComplete: true });
        
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        setStream(null);
        setIsListening(false);
    }
  }, [connected, isListening]);

  const send = useCallback((parts: Part | Part[]) => {
    if (sessionRef.current) {
      sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: Array.isArray(parts) ? parts : [parts] }] });
    }
  }, []);

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
