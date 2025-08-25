
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, Part } from '@google/genai';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext, base64ToArrayBuffer } from '@/lib/utils';
import type { ItineraryData } from '@/app/page';

export interface UseLiveAPIResults {
  session: LiveSession | null;
  connected: boolean;
  text: string;
  error: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  volume: number;
  connect: (itineraryData?: ItineraryData) => Promise<void>;
  disconnect: () => void;
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
  const [volume, setVolume] = useState(0);

  // State for the guided tour
  const [tourData, setTourData] = useState<ItineraryData | null>(null);
  const [tourIndex, setTourIndex] = useState(-1);

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
    setTourData(null);
    setTourIndex(-1);
  }, []);

  const getTourPrompt = (index: number, data: ItineraryData): string | null => {
    const allLocations = data.itinerary.flatMap(day => day.locations);
    if (index >= allLocations.length) {
      return "That's the end of the itinerary! Would you like me to find hotels or trendy events for this destination?";
    }
    const location = allLocations[index];
    if (index === 0) {
      return `Let's start the tour of your itinerary for ${data.destination}. The first stop is ${location.name}. Here's a little about it: ${location.description}. Let me know when you're ready for the next stop.`;
    }
    return `Next up is ${location.name}. ${location.description}. What's next on your mind?`;
  };

  const processUserCommand = (command: string) => {
    const lowerCaseCommand = command.toLowerCase();
    if (lowerCaseCommand.includes('next') || lowerCaseCommand.includes('continue')) {
      const nextIndex = tourIndex + 1;
      if (tourData) {
        const prompt = getTourPrompt(nextIndex, tourData);
        if (prompt && sessionRef.current) {
          setTourIndex(nextIndex);
          setText(''); // Clear previous response
          // Send the prompt directly to the session to avoid recursion
          sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [{ text: prompt }] }] });
        }
      }
    } else {
        // If it's not a "next" command, just send the text as a normal query.
        if (sessionRef.current) {
          sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [{ text: command }] }] });
        }
    }
  };


  const connect = useCallback(async (itineraryData?: ItineraryData) => {
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
        streamer.onComplete = () => {
            setIsSpeaking(false);
            if (!isListening) setIsListening(true);
        };
        audioStreamerRef.current = streamer;
      }
      if (audioStreamerRef.current.context.state === 'suspended') {
        await audioStreamerRef.current.resume();
      }

      const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaStreamRef.current = userMediaStream;
      setStream(userMediaStream);
      
      const genAI = new GoogleGenAI({ apiKey });

      let initialPrompt: Part[] | undefined = undefined;
      if (itineraryData) {
        setTourData(itineraryData);
        setTourIndex(0);
        const promptText = getTourPrompt(0, itineraryData);
        if (promptText) {
          initialPrompt = [{ text: promptText }];
        }
      }
      
      const newSession = await genAI.live.connect({
        model: 'gemini-live-2.5-flash-preview',
        config: {
          audio: {input: {encoding: 'LINEAR16', sampleRateHertz: 16000}, output: {encoding: 'LINEAR16', sampleRateHertz: 24000}},
          video: {input: {encoding: 'H264'}},
          text: {},
        },
        stream: userMediaStream,
        initialContent: initialPrompt,
        callbacks: {
          onopen: () => {
            setConnected(true);
            setIsListening(true);
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
                const parts = message.serverContent.modelTurn?.parts || [];
                let currentText = '';
                parts.forEach(part => {
                  if ('text' in part) {
                    currentText += part.text;
                  } else if (part.inlineData?.mimeType?.startsWith("audio/")) {
                    const audioData = base64ToArrayBuffer(part.inlineData.data);
                    audioStreamerRef.current?.addPCM16(new Uint8Array(audioData));
                  }
                });
                setText(prev => prev + currentText);
              } else if ('turnComplete' in message.serverContent) {
                // When Gemini is done speaking, start listening again.
                if (!isListening) setIsListening(true);
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
  }, [disconnect, isListening]);


  const send = useCallback((parts: Part | Part[]) => {
    if (sessionRef.current) {
        setIsListening(false);
        // If it's a tour, let the command processor handle it.
        const commandPart = Array.isArray(parts) ? parts.find(p => 'text' in p) : ('text' in parts ? parts : undefined);
        if (tourData && commandPart && 'text' in commandPart && commandPart.text) {
            processUserCommand(commandPart.text);
            return;
        }

        // Otherwise, send as normal.
        sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: Array.isArray(parts) ? parts : [parts] }] });
    }
  }, [tourData, processUserCommand]);

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

      const monitor = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
        const currentVolume = average / 128;
        setVolume(currentVolume);
        animationFrameId = requestAnimationFrame(monitor);
      };
      monitor();

      return () => {
        cancelAnimationFrame(animationFrameId);
        source.disconnect();
        analyser.disconnect();
        audioContext.close().catch(console.error);
      };
    } else {
      setVolume(0);
    }
  }, [stream, isListening]);

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
  };
}
