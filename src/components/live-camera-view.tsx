
'use client';


import React, { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '@/context/live-api-context';
import { cn } from '@/lib/utils';
import { Mic, Video } from 'lucide-react';
import { Button } from './ui/button';


function VoiceVisualizer({ stream }: { stream: MediaStream | null }) {
 const [volume, setVolume] = useState(0);
 const animationFrameRef = useRef<number>();


 useEffect(() => {
   if (stream) {
     const audioContext = new AudioContext();
     const analyser = audioContext.createAnalyser();
     const source = audioContext.createMediaStreamSource(stream);
     source.connect(analyser);
     analyser.fftSize = 256;
     const bufferLength = analyser.frequencyBinCount;
     const dataArray = new Uint8Array(bufferLength);


     const getVolume = () => {
       analyser.getByteFrequencyData(dataArray);
       const average =
         dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
       setVolume((average / 128) * 1.5);
       animationFrameRef.current = requestAnimationFrame(getVolume);
     };


     getVolume();


     return () => {
       if (animationFrameRef.current) {
         cancelAnimationFrame(animationFrameRef.current);
       }
       source.disconnect();
       analyser.disconnect();
       audioContext.close().catch(console.error);
     };
   } else {
     setVolume(0);
   }
 }, [stream]);
  const showVisualizer = volume > 0.05;


 if (!showVisualizer) {
   return null;
 }
  const bars = Array.from({ length: 64 }, () => Math.random() * 0.6 + 0.4);
 return (
   <div className="flex items-center justify-center gap-0.5 h-10 w-40 p-2">
     {bars.map((barHeight, index) => (
       <div
         key={index}
         className="w-0.5 rounded-full bg-primary transition-all duration-75"
         style={{
           height: `${Math.max(4, volume * 5 * barHeight * 100)}%`,
         }}
       />
     ))}
   </div>
 );
}


export function LiveCameraView() {
 const { connected, stream, connect, disconnect } = useLiveAPIContext();
 const videoRef = useRef<HTMLVideoElement>(null);


 useEffect(() => {
   if (stream && videoRef.current) {
     videoRef.current.srcObject = stream;
   }
 }, [stream, connected]);


 const toggleConnection = () => {
   if (connected) {
     disconnect();
   } else {
     connect();
   }
 };


 const showVisualizer = stream && connected;


 return (
   <div className="fixed bottom-6 left-6 z-50">
     <div className={cn(
       "flex items-center bg-muted/80 backdrop-blur-sm border border-primary/20 rounded-full h-24 shadow-lg transition-all duration-300",
       showVisualizer ? "w-64" : "w-24"
     )}>
       <div className="relative group w-24 h-24 flex-shrink-0">
         <div className="absolute inset-1.5 size-[84px] rounded-full bg-background overflow-hidden flex items-center justify-center">
           {connected && stream ? (
             <video
               ref={videoRef}
               className="w-full h-full object-cover scale-x-[-1]"
               autoPlay
               playsInline
               muted
             />
           ) : (
             <Mic className="text-muted-foreground" size={32} />
           )}
         </div>
         <div className="absolute inset-1.5 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
           <Button
             size="icon"
             variant={connected ? 'destructive' : 'default'}
             onClick={toggleConnection}
             className="rounded-full"
           >
             <Video size={20} />
           </Button>
         </div>
       </div>
       <div className="w-40 flex-shrink-0">
           {showVisualizer && <VoiceVisualizer stream={stream} />}
       </div>
     </div>
   </div>
 );
}
