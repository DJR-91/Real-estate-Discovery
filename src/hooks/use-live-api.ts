
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveConnectConfig, Part } from '@google/genai';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext } from '@/lib/utils';
// import VolMeterWorklet from '@/lib/worklets/vol-meter'; // Temporarily disabled to resolve syntax error
import { base64ToArrayBuffer } from '@/lib/utils';
import { defaultVoice, VoiceKey } from '@/lib/config/voice-mapping';

export interface UseLiveAPIResults {
 session: LiveSession | null;
 connected: boolean;
 text: string;
 error: string | null;
 config: LiveConnectConfig;
 setConfig: (config: LiveConnectConfig) => void;
 model: string;
 setModel: (model: string) => void;
 voice: VoiceKey;
 setVoice: (voice: VoiceKey) => void;
 connect: () => Promise<void>;
 disconnect: () => void;
 volume: number;
 send: (parts: Part | Part[]) => void;
 stream: MediaStream | null;
 isListening: boolean;
 startAudioTurn: () => void;
 stopAudioTurn: () => void;
 startOngoingAudioTurn: () => void;
}

export function useLiveAPI(): UseLiveAPIResults {
 const sessionRef = useRef<LiveSession | null>(null);
 const audioStreamerRef = useRef<AudioStreamer | null>(null);
 const streamRef = useRef<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
 const [text, setText] = useState('');
 const [error, setError] = useState<string | null>(null);
 const [volume, setVolume] = useState(0);
 const [model, setModel] = useState('gemini-live-2.5-flash-preview');
 const [voice, setVoice] = useState<VoiceKey>(defaultVoice);
 const [config, setConfig] = useState<LiveConnectConfig>({});
 const [stream, setStream] = useState<MediaStream | null>(null);
 const [isListening, setIsListening] = useState(false);

 const initializeAudio = useCallback(async () => {
   if (audioStreamerRef.current) {
     if (audioStreamerRef.current.context.state === 'suspended') {
       await audioStreamerRef.current.resume();
     }
     return true;
   }
   try {
     const audioCtx = await audioContext({ id: "audio-out" });
     console.log(`AudioContext created on user gesture. Initial state: ${audioCtx.state}`);
     const streamer = new AudioStreamer(audioCtx);
    
     audioStreamerRef.current = streamer;
     return true;
   } catch (e) {
     console.error("Failed to initialize audio context or streamer:", e);
     setError("Could not initialize audio. Please check permissions.");
     return false;
   }
 }, []);

 const disconnect = useCallback(() => {
   if (sessionRef.current) {
     sessionRef.current.close();
     sessionRef.current = null;
   }
   if (streamRef.current) {
     streamRef.current.getTracks().forEach(track => track.stop());
     streamRef.current = null;
   }
   setStream(null);
   setConnected(false);
   setText('');
   setIsListening(false);
 }, []);

 const connect = useCallback(async () => {
   if (sessionRef.current) {
     return;
   }
   setError(null);
   setText('');

   const isAudioReady = await initializeAudio();
   if (!isAudioReady) {
     return;
   }

   let mediaStream: MediaStream | null = null;
   const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

   if (!apiKey) {
     setError("API key is not configured.");
     return;
   }

   try {
     mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
     setStream(mediaStream);
     streamRef.current = mediaStream;

     const audioTrack = mediaStream.getAudioTracks()[0];
     if (audioTrack) {
       console.log("🎤 Microphone audio track status:", {
         enabled: audioTrack.enabled,
         muted: audioTrack.muted,
         readyState: audioTrack.readyState,
       });
     }

     const genAI = new GoogleGenAI({ apiKey });
     const newSession = await genAI.live.connect({
       model,
       config: {
         audio: {input: {encoding: 'LINEAR16', sampleRateHertz: 16000}, output: {encoding: 'LINEAR16', sampleRateHertz: 24000}},
         video: {input: {encoding: 'H264'}},
         text: {},
         voice: { ttsVoice: voice },
       },
       stream: mediaStream,
       callbacks: {
         onopen: () => {
            setConnected(true);
            // Automatically start an ongoing audio turn once connected
            if (sessionRef.current) {
                setIsListening(true);
                sessionRef.current.sendClientContent({ turns: [], turnComplete: false });
            }
         },
         onclose: () => disconnect(),
         onerror: (e) => {
           console.error('🔴 Live API Error:', e);
           setError('An error occurred with the live connection.');
           disconnect();
         },
         onmessage: (message) => {
           if (message.serverContent) {
             if ('interrupted' in message.serverContent) {
               audioStreamerRef.current?.stop();
               setText('');
               return;
             }
             if ('turnComplete' in message.serverContent) {
                // In always-on mode, restart listening after turn is complete
                if(connected && sessionRef.current) {
                    setIsListening(true);
                    sessionRef.current.sendClientContent({ turns: [], turnComplete: false });
                }
               return;
             }
             if ('modelTurn' in message.serverContent) {
               setIsListening(false);
               const parts = message.serverContent.modelTurn?.parts || [];
               parts.forEach(part => {
                 if ('text' in part) {
                   setText(prev => prev + part.text);
                 } else if (part.inlineData?.mimeType?.startsWith("audio/")) {
                   const audioData = base64ToArrayBuffer(part.inlineData.data);
                   audioStreamerRef.current?.addPCM16(new Uint8Array(audioData));
                 }
               });
             }
           } else if (message.clientContent) {
               if (message.clientContent.turns?.some(t => 'text' in t && t.text)) {
                 setText('');
               }
           }
         },
       },
     });
     sessionRef.current = newSession;
   } catch (e: any) {
     console.error('🔴 Failed to initialize or connect to Live API:', e);
     setError(e.message || 'Failed to initialize the API client.');
     if (mediaStream) {
       mediaStream.getTracks().forEach(track => track.stop());
       setStream(null);
       streamRef.current = null;
     }
   }
 }, [model, voice, initializeAudio, disconnect, connected]);

 const send = useCallback((parts: Part | Part[]) => {
   if (sessionRef.current) {
     sessionRef.current.sendClientContent({ turns: Array.isArray(parts) ? parts : [parts] });
   }
 }, []);

 const startAudioTurn = useCallback(() => {
   if (sessionRef.current && connected && !isListening) {
     setText('');
     setIsListening(true);
     sessionRef.current.sendClientContent({ turns: [], turnComplete: false });
   }
 }, [connected, isListening]);

 const stopAudioTurn = useCallback(() => {
   if (sessionRef.current && connected && isListening) {
     setIsListening(false);
     sessionRef.current.sendClientContent({ turns: [], turnComplete: true });
   }
 }, [connected, isListening]);
 
  const startOngoingAudioTurn = useCallback(() => {
    if (sessionRef.current && connected && !isListening) {
      setText('');
      setIsListening(true);
      sessionRef.current.sendClientContent({ turns: [], turnComplete: false });
    }
  }, [connected, isListening]);

 return {
   session: sessionRef.current,
   connected,
   text,
   error,
   config,
   setConfig,
   connect,
   disconnect,
   volume,
   model,
   setModel,
   voice,
   setVoice,
   send,
   stream,
   isListening,
   startAudioTurn,
   stopAudioTurn,
   startOngoingAudioTurn,
 };
}
