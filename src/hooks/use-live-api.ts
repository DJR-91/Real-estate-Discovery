
'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, LiveSession, Part } from '@google/genai';
import { base64ToArrayBuffer } from '@/lib/utils';

export interface UseLiveAPIResults {
  session: LiveSession | null;
  connected: boolean;
  text: string;
  error: string | null;
  isSpeaking: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
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
      source.onended = () => {
        // Check if this was the last buffer to signal speaking has stopped
        // This is a simplified check; a more robust solution would manage a queue.
        setIsSpeaking(false);
      }

    } catch(e) {
      console.error("Error decoding or playing audio:", e);
      setError("Failed to play audio response.");
    }
  }, []);

  const connect = useCallback(async () => {
    if (sessionRef.current) {
      disconnect();
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
      const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setStream(userMediaStream);
      mediaStreamRef.current = userMediaStream;

      const genAI = new GoogleGenAI({ apiKey });
      const newSession = await genAI.live.connect({
        model: 'gemini-live-2.5-flash-preview',
        config: {
          audio: {input: {encoding: 'LINEAR16', sampleRateHertz: 16000}, output: {encoding: 'LINEAR16', sampleRateHertz: 24000}},
          video: {input: {encoding: 'H264'}},
          text: {},
        },
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
                setText('');
              } else if ('modelTurn' in message.serverContent) {
                const parts = message.serverContent.modelTurn?.parts || [];
                let hasAudio = false;
                parts.forEach(part => {
                  if ('text' in part) {
                    setText(prev => prev + part.text);
                  } else if (part.inlineData?.mimeType?.startsWith("audio/")) {
                    hasAudio = true;
                    const audioData = base64ToArrayBuffer(part.inlineData.data);
                    playAudio(audioData);
                  }
                });
                if (hasAudio) {
                    setIsSpeaking(true);
                }
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

  const send = useCallback((parts: Part | Part[]) => {
    if (sessionRef.current) {
        setText(''); // Clear previous text on new input
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
    isSpeaking,
  };
}
