'use client';

import { useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Session as LiveSession, Part } from '@google/genai/web';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext, base64ToArrayBuffer } from '@/lib/utils';
import type { ItineraryData } from '@/app/page';
import { useLiveStore } from '@/store/live-store';
import { generateLocationDescription } from '@/ai/flows/generate-location-description';
import { AudioRecorder } from '@/utils/audio-recorder';

export function useLiveAPI() {
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

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
    
    const locationDescription = location.description;
    if (index === 0) {
        // Create a summary of the 3-day itinerary
        const itinerarySummary = data.itinerary.map(day => 
            `Day ${day.day}, themed "${day.title}", will take you to locations like ${day.locations.map(l => l.name).join(', ')}.`
        ).join(' ');

        return `Welcome back, Andy, and thank you for being a genius level 1 customer! We understand your travel preferences and have tailored these recommendations. I'm your expert tour guide for ${data.destination}. Here's a quick look at your 3-day plan: ${itinerarySummary} Now, let's start our tour. Our first stop is ${location.name}. ${locationDescription}. Let me know when you're ready for the next stop.`;
    }
    return `Next up is ${location.name}. ${locationDescription}. What's next on your mind?`;
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
      

      let initialContent: Part[] | undefined = undefined;
      let systemPromptContent: any = undefined;
      if (data) {
        startTour(data);
        const welcomePrompt = await getTourPrompt(0, data);
        if (welcomePrompt) {
          const systemPrompt = `You are a friendly and expert tour guide for a user named Andy. Your goal is to lead him on a virtual tour of his upcoming trip to ${data.destination}. You have access to tools to control the 3D map.
          
1. If he says "next" or "continue", call "goToNextLocation".
2. Whenever you discuss a specific tourist attraction or point of interest from the itinerary (e.g., the first stop, lunch spot, museums), you MUST call "viewOnMap" passing the name of the attraction. Do this IMMEDIATELY as you start talking about it so the map syncs with your voice.

Do NOT just say "Okay" or acknowledge textually. Respond naturally and drive the map! Speak the introductory message provided below.`;
          systemPromptContent = { parts: [{ text: systemPrompt }] };
          initialContent = [
            {text: welcomePrompt}
          ];
        }
      }
      
      const genAI = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

      const newSession = await genAI.live.connect({
        model: 'gemini-2.5-flash-native-audio-latest',
        config: {
          systemInstruction: systemPromptContent,
          responseModalities: ["AUDIO" as any],
          tools: [{
            functionDeclarations: [
              {
                name: 'goToNextLocation',
                description: 'Exposes the next scheduled point of interest from the itinerary on the 3D map viewport. Use this when the user says "next" or "continue".',
              },
              {
                name: 'viewOnMap',
                description: 'Syncs the 3D map to a specific location you are discussing. Always call this whenever you mention a tourist attraction or location from the itinerary.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    locationName: { type: 'STRING', description: 'The name of the location to fly the camera to.' }
                  },
                  required: ['locationName']
                }
              }
            ]
          }]
        },
        callbacks: {
          onopen: () => {
            console.log('Live API Connection Opened');
            setConnected(true);
          },
          onclose: (e: any) => {
            console.log('Live API Connection Closed:', e?.code, e?.reason);
            reset();
          },
          onerror: (e: any) => {
            console.error('Live API Error event:', e);
            setError(`API Error: ${e.message || 'Unknown error'}`);
            reset();
          },
          onmessage: (message) => {
            console.log('Live API Message received:', {
              serverContent: !!message.serverContent,
              setupComplete: !!message.setupComplete,
              toolCall: !!message.toolCall,
              goAway: !!message.goAway
            });
            if (message.toolCall) {
              const call = (message.toolCall as any).functionCalls?.[0];
                if (call && call.name === 'goToNextLocation') {
                  console.log("[use-live-api] goToNextLocation tool called by model!");
                  const currentTourIndex = useLiveStore.getState().tourIndex;
                  const nextIndex = currentTourIndex + 1;
                  useLiveStore.setState({ tourIndex: nextIndex });
                  console.log("[use-live-api] Advanced tourIndex to:", nextIndex);
                  
                  if ((newSession as any).sendToolResponse) {
                    (newSession as any).sendToolResponse({
                      functionResponses: [{
                        name: 'goToNextLocation',
                        id: call.id,
                        response: { output: 'Successfully moved to next location.' }
                      }]
                    });
                  }
                } else if (call && call.name === 'viewOnMap') {
                  console.log("[use-live-api] viewOnMap tool called by model with locationName:", call.args?.locationName);
                  const locationName = call.args?.locationName;
                  const itineraryData = useLiveStore.getState().itineraryData;
                  if (itineraryData && itineraryData.itinerary) {
                     let foundDay = -1;
                     let foundIndex = -1;
                     for (let day = 0; day < itineraryData.itinerary.length; day++) {
                        const locs = itineraryData.itinerary[day].locations;
                        const idx = locs.findIndex(loc => loc.name === locationName);
                        if (idx >= 0) {
                           foundDay = day;
                           foundIndex = idx;
                           break;
                        }
                     }
                     if (foundIndex >= 0) {
                        useLiveStore.setState({ activeDay: foundDay, tourIndex: foundIndex });
                        console.log("[use-live-api] Set activeDay to:", foundDay, "and tourIndex to:", foundIndex);
                     }
                  }
                  
                  if ((newSession as any).sendToolResponse) {
                    (newSession as any).sendToolResponse({
                      functionResponses: [{
                        name: 'viewOnMap',
                        id: call.id,
                        response: { output: `Successfully viewed ${locationName} on map.` }
                      }]
                    });
                  }
                }
            }

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
                  } else if (part.inlineData?.mimeType?.startsWith("audio/") && part.inlineData.data) {
                    const audioData = base64ToArrayBuffer(part.inlineData.data);
                    audioStreamerRef.current?.addPCM16(new Uint8Array(audioData));
                  }
                });
                appendText(currentText);
              } 
            }
          },
        },
      });
      setSession(newSession);

      const recorder = new AudioRecorder();
      recorder.onData = (base64Data) => {
        if (base64Data) {
          console.log("[use-live-api] Sending audio chunk (length):", base64Data.length);
          (newSession as any).sendRealtimeInput({
            audio: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Data
            }
          } as any);
        }
      };
      await recorder.start();
      audioRecorderRef.current = recorder;

      if (initialContent) {
        newSession.sendClientContent({ turns: [{ role: 'user', parts: initialContent }] });
      }

    } catch (e: any) {
      console.error('Failed to initialize or connect to Live API:', e);
      if (e.name === 'NotAllowedError') {
        setError('Microphone/Camera permission denied. Please check your browser Settings and macOS System Settings.');
      } else {
        setError(e.message || 'Failed to initialize the API client.');
      }
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
      session.close();
      reset();
    }
  }, [session, reset]);

  // Effect to auto-stop recorder when session disconnects
  useEffect(() => {
    if (!session && audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
    }
  }, [session]);

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
