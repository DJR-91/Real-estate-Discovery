'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, Part } from '@google/genai';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext, base64ToArrayBuffer } from '@/lib/utils';

export interface UseLiveAPIResults {
  session: LiveSession | null;
  connected: boolean;
  text: string;
  error: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  volume: number; // For the audio visualizer
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (parts: Part | Part[]) => void;
  stream: MediaStream | null;
}

export function useLiveAPI(): UseLiveAPIResults {
  const sessionRef = useRef<LiveSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  // Refs for client-side silence detection
  const silenceDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);

  const endAudioTurn = useCallback(() => {
    if (sessionRef.current && isListening) {
        console.log('--- Ending audio turn due to silence ---');
        setIsListening(false);
        hasSpokenRef.current = false;
        if (silenceDetectionTimeoutRef.current) {
            clearTimeout(silenceDetectionTimeoutRef.current);
            silenceDetectionTimeoutRef.current = null;
        }
        sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [] }], turnComplete: true });
    }
  }, [isListening]);
  
  const startListeningTurn = useCallback(() => {
    if (sessionRef.current) {
      console.log('--- Starting new listening turn ---');
      hasSpokenRef.current = false; // Reset for the new turn
      setText('');
      setIsListening(true);
      sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [] }], turnComplete: false });
    }
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (silenceDetectionTimeoutRef.current) {
        clearTimeout(silenceDetectionTimeoutRef.current);
    }
    audioStreamerRef.current?.stop();
    setStream(null);
    setConnected(false);
    setText('');
    setError(null);
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    if (stream && isListening) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let animationFrameId: number;

      const SILENCE_THRESHOLD = 0.01; // Volume level to consider as silence
      const SILENCE_DURATION_MS = 2000; // 2 seconds of silence to end turn

      const monitor = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
        const currentVolume = average / 128;
        setVolume(currentVolume);

        if (currentVolume > SILENCE_THRESHOLD) {
            hasSpokenRef.current = true; // User has started speaking
            // If there's a silence timer running, cancel it
            if (silenceDetectionTimeoutRef.current) {
                clearTimeout(silenceDetectionTimeoutRef.current);
                silenceDetectionTimeoutRef.current = null;
            }
        } else if (hasSpokenRef.current && !silenceDetectionTimeoutRef.current) {
            // User has stopped speaking, start the silence timer
            silenceDetectionTimeoutRef.current = setTimeout(() => {
                endAudioTurn();
            }, SILENCE_DURATION_MS);
        }
        
        animationFrameId = requestAnimationFrame(monitor);
      };

      monitor();

      return () => {
        cancelAnimationFrame(animationFrameId);
        if (silenceDetectionTimeoutRef.current) {
            clearTimeout(silenceDetectionTimeoutRef.current);
        }
        source.disconnect();
        analyser.disconnect();
        audioContext.close().catch(console.error);
      };
    } else {
      setVolume(0);
    }
  }, [stream, isListening, endAudioTurn]);

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
      if (!audioStreamerRef.current) {
        const audioCtx = await audioContext({ id: "audio-out", config: { sampleRate: 24000 } });
        const streamer = new AudioStreamer(audioCtx);
        streamer.onStart = () => setIsSpeaking(true);
        streamer.onComplete = () => setIsSpeaking(false);
        audioStreamerRef.current = streamer;
      }
      if (audioStreamerRef.current.context.state === 'suspended') {
        await audioStreamerRef.current.resume();
      }
      
      const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaStreamRef.current = userMediaStream;
      setStream(userMediaStream);

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
          onopen: () => {
            setConnected(true);
          },
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
                setIsListening(false);
                if (silenceDetectionTimeoutRef.current) {
                    clearTimeout(silenceDetectionTimeoutRef.current);
                    silenceDetectionTimeoutRef.current = null;
                }
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
                startListeningTurn();
              }
            } else if (message.clientContent?.turns?.some(t => 'text' in t && t.text)) {
              setText('');
            }
          },
        },
      });

      sessionRef.current = newSession;
      startListeningTurn();

    } catch (e: any) {
      console.error('Failed to initialize or connect to Live API:', e);
      setError(e.message || 'Failed to initialize the API client.');
      disconnect();
    }
  }, [disconnect, startListeningTurn]);

  const send = useCallback((parts: Part | Part[]) => {
    if (sessionRef.current) {
      setIsListening(false);
      sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: Array.isArray(parts) ? parts : [parts] }] });
    }
  }, []);

  // These functions are no longer needed by the UI but are kept for potential future use or debugging.
  const startAudioTurn = useCallback(() => {}, []);
  const stopAudioTurn = useCallback(() => {}, []);

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
    isSpeaking,
    volume,
    startAudioTurn, // Kept for API consistency, but not used by UI in this mode.
    stopAudioTurn,  // Kept for API consistency, but not used by UI in this mode.
  };
}