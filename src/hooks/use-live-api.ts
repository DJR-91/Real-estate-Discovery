
'use client';

import { useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, Part } from '@google/genai';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext, base64ToArrayBuffer } from '@/lib/utils';
import type { ItineraryData } from '@/app/page';
import { useLiveStore } from '@/store/live-store';
import { generateLocationDescription } from '@/ai/flows/generate-location-description';

export function useLiveAPI() {
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  // Get state and actions from the Zustand store
  const {
    session,
    micActive,
    cameraActive,
    isSpeaking,
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
  
  const isListening = micActive && !isSpeaking;

  const getTourPrompt = useCallback(async (index: number, data: ItineraryData): Promise<string | null> => {
    const allLocations = data.itinerary.flatMap(day => day.locations);
    
    if (index >= allLocations.length) {
      return "That's the end of the itinerary! Would you like me to find hotels or trendy events for this destination?";
    }
    
    const location = allLocations[index];
    
    try {
        const { description } = await generateLocationDescription({ locationName: `${location.name}, ${data.destination}` });
        
        if (index === 0) {
            // Create a summary of the 3-day itinerary
            const itinerarySummary = data.itinerary.map(day => 
                `Day ${day.day}, themed "${day.title}", will take you to locations like ${day.locations.map(l => l.name).join(', ')}.`
            ).join(' ');

            return `Welcome back, Andy, and thank you for being a genius level 1 customer! We understand your travel budget preferences and have tailored these recommendations based on your travel history. I'm your expert tour guide for ${data.destination}, and I'm here to provide a preview of your exciting trip. Here's a quick look at your 3-day plan: ${itinerarySummary} Now, let's start our tour. Our first stop is ${location.name}. ${description}. Let me know when you're ready for the next stop.`;
        }
        return `Next up is ${location.name}. ${description}. What's next on your mind?`;

    } catch (e) {
        console.error("Failed to generate location description:", e);
        // Fallback to the original description if the flow fails
        if (index === 0) {
            return `Let's start the tour of your itinerary for ${data.destination}. The first stop is ${location.name}. Here's a little about it: ${location.description}. Let me know when you're ready for the next stop.`;
        }
        return `Next up is ${location.name}. ${location.description}. What's next on your mind?`;
    }
  }, []);

  const processUserCommand = useCallback(async (command: string) => {
    const lowerCaseCommand = command.toLowerCase();
    if (lowerCaseCommand.includes('next') || lowerCaseCommand.includes('continue')) {
      const nextIndex = tourIndex + 1;
      if (itineraryData) {
        const prompt = await getTourPrompt(nextIndex, itineraryData);
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
  
  const streamFromStore = useLiveStore((state) => state.stream);

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
        };
        audioStreamerRef.current = streamer;
      }
      if (audioStreamerRef.current.context.state === 'suspended') {
        await audioStreamerRef.current.resume();
      }

      const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      userMediaStream.getAudioTracks().forEach(track => {
        track.enabled = micActive;
      });
      userMediaStream.getVideoTracks().forEach(track => {
        track.enabled = cameraActive;
      });
      setStream(userMediaStream);
      
      const genAI = new GoogleGenAI({ apiKey });

      let initialContent: Part[] | undefined = undefined;
      if (data) {
        startTour(data);
        const welcomePrompt = await getTourPrompt(0, data);
        if (welcomePrompt) {
          const systemPrompt = `You are a friendly and expert tour guide for a user named Andy. Your goal is to lead him on a virtual tour of his upcoming trip to ${data.destination}. Wait for him to say "next" or "continue" before proceeding to the next location. You must follow the instructions and speak the introductory message provided below.`;
          initialContent = [
            {text: systemPrompt},
            {text: welcomePrompt}
          ];
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
        initialContent: initialContent,
        callbacks: {
          onopen: () => {
            setConnected(true);
          },
          onclose: () => reset(),
          onerror: (e) => {
            console.error('Live API Error:', e);
            setError('An error with the live connection occurred.');
            reset();
          },
          onmessage: (message) => {
            if (message.serverContent) {
              if ('interrupted' in message.serverContent) {
                audioStreamerRef.current?.stop();
                setText('');
              } else if ('modelTurn' in message.serverContent) {
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
      reset();
    }
  }, [reset, micActive, cameraActive, session, appendText, getTourPrompt, setConnected, setError, setIsSpeaking, setSession, setStream, startTour, setText]);
  
  const send = useCallback((parts: Part | Part[]) => {
    if (!session) return;
    
    const commandPart = Array.isArray(parts) ? parts.find(p => 'text' in p) : ('text' in parts ? parts : undefined);
    
    if (itineraryData && commandPart && 'text' in commandPart && commandPart.text) {
        processUserCommand(commandPart.text);
        return;
    }

    session.sendClientContent({ turns: [{ role: 'user', parts: Array.isArray(parts) ? parts : [parts] }] });
  }, [session, itineraryData, processUserCommand]);

  const disconnect = useCallback(() => {
    if (session) {
      session.disconnect();
      reset();
    }
  }, [session, reset]);

  // Effect to enable/disable mic track based on `micActive` state
  useEffect(() => {
    if (streamFromStore) {
        streamFromStore.getAudioTracks().forEach(track => {
            track.enabled = micActive;
        });
    }
  }, [micActive, streamFromStore]);

    // Effect to enable/disable camera track based on `cameraActive` state
  useEffect(() => {
    if (streamFromStore) {
        streamFromStore.getVideoTracks().forEach(track => {
            track.enabled = cameraActive;
        });
    }
  }, [cameraActive, streamFromStore]);

  // Effect for volume meter
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
  
  // Update the global isListening state based on mic and speaking status
  useEffect(() => {
    setIsListening(isListening);
  }, [isListening, setIsListening]);

  return { connect, disconnect, send };
}
