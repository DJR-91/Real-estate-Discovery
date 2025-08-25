
'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleGenAI, LiveSession, Part } from '@google/genai';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext, base64ToArrayBuffer } from '@/lib/utils';
import type { ItineraryData } from '@/app/page';
import { useLiveStore } from '@/store/live-store';

export function useLiveAPI() {
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get state and actions from the Zustand store
  const {
    session,
    isListening,
    itineraryData,
    tourIndex,
    setSession,
    setConnected,
    setStream,
    setError,
    setText,
    appendText,
    setIsListening,
    setIsSpeaking,
    setVolume,
    startTour,
    setTourIndex,
    reset,
  } = useLiveStore();

  const getTourPrompt = useCallback((index: number, data: ItineraryData): string | null => {
    const allLocations = data.itinerary.flatMap(day => day.locations);
    if (index >= allLocations.length) {
      return "That's the end of the itinerary! Would you like me to find hotels or trendy events for this destination?";
    }
    const location = allLocations[index];
    if (index === 0) {
      return `Let's start the tour of your itinerary for ${data.destination}. The first stop is ${location.name}. Here's a little about it: ${location.description}. Let me know when you're ready for the next stop.`;
    }
    return `Next up is ${location.name}. ${location.description}. What's next on your mind?`;
  }, []);

  const processUserCommand = useCallback((command: string) => {
    const lowerCaseCommand = command.toLowerCase();
    if (lowerCaseCommand.includes('next') || lowerCaseCommand.includes('continue')) {
      const nextIndex = tourIndex + 1;
      if (itineraryData) {
        const prompt = getTourPrompt(nextIndex, itineraryData);
        if (prompt && session) {
          setTourIndex(nextIndex);
          setText(''); // Clear previous response
          session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: prompt }] }] });
        }
      }
    } else if (session) {
      session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: command }] }] });
    }
  }, [tourIndex, itineraryData, getTourPrompt, session, setTourIndex, setText]);

  const disconnect = useCallback(() => {
    if (session) {
      session.close();
    }
    audioStreamerRef.current?.stop();
    reset();
  }, [session, reset]);

  const connect = useCallback(async (data?: ItineraryData) => {
    if (session) return;

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
      setStream(userMediaStream);
      
      const genAI = new GoogleGenAI({ apiKey });

      let initialPrompt: Part[] | undefined = undefined;
      if (data) {
        startTour(data);
        const promptText = getTourPrompt(0, data);
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
                appendText(currentText);
              } else if ('turnComplete' in message.serverContent) {
                if (!isListening) setIsListening(true);
              }
            } else if (message.clientContent?.turns?.some(t => 'text' in t && t.text)) {
              setText('');
            }
          },
        },
      });
      setSession(newSession);

    } catch (e: any) {
      console.error('Failed to initialize or connect to Live API:', e);
      setError(e.message || 'Failed to initialize the API client.');
      disconnect();
    }
  }, [disconnect, isListening, session, appendText, getTourPrompt, setConnected, setError, setIsListening, setIsSpeaking, setSession, setStream, startTour, setText]);

  const send = useCallback((parts: Part | Part[]) => {
    if (!session) return;
    
    setIsListening(false);
    const commandPart = Array.isArray(parts) ? parts.find(p => 'text' in p) : ('text' in parts ? parts : undefined);
    
    if (itineraryData && commandPart && 'text' in commandPart && commandPart.text) {
        processUserCommand(commandPart.text);
        return;
    }

    session.sendClientContent({ turns: [{ role: 'user', parts: Array.isArray(parts) ? parts : [parts] }] });
  }, [session, itineraryData, processUserCommand, setIsListening]);
  
  const streamFromStore = useLiveStore((state) => state.stream);
  useEffect(() => {
    if (streamFromStore && isListening) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(streamFromStore);
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
  }, [streamFromStore, isListening, setVolume]);

  useEffect(() => {
    if (!isInitialized) {
        useLiveStore.setState({ connect, disconnect, send });
        setIsInitialized(true);
    }
  }, [isInitialized, connect, disconnect, send]);
}
