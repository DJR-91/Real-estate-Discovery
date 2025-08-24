

'use client';


import React, { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '@/context/live-api-context';
import { cn } from '@/lib/utils';
import { Mic, Send, Video, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';


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
 const { connected, stream, connect, disconnect, send, text: responseText, startAudioTurn, stopAudioTurn, isListening } = useLiveAPIContext();
 const videoRef = useRef<HTMLVideoElement>(null);
 const [inputText, setInputText] = useState('');
 const [isTextEntryVisible, setIsTextEntryVisible] = useState(false);
 
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
 
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && connected) {
      send({ text: inputText });
      setInputText('');
    }
  };


 const showVisualizer = stream && connected;


 return (
    <div className="absolute bottom-6 left-6 z-50 flex items-end gap-4">
        <div className={cn(
        "flex items-center bg-muted/80 backdrop-blur-sm border border-primary/20 rounded-full h-24 shadow-lg transition-all duration-300",
        showVisualizer ? "w-64" : "w-24"
        )}>
            <div className="relative group w-24 h-24 flex-shrink-0">
                <div 
                    className="absolute inset-1.5 size-[84px] rounded-full bg-background overflow-hidden flex items-center justify-center cursor-pointer border-2 border-transparent"
                    onMouseDown={startAudioTurn}
                    onMouseUp={stopAudioTurn}
                    onTouchStart={startAudioTurn}
                    onTouchEnd={stopAudioTurn}
                >
                    {isListening ? (
                        <Mic className="text-destructive" size={32} />
                    ) : connected && stream ? (
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
        {connected && (
            <div className="flex flex-col gap-2 w-96">
                <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsTextEntryVisible(!isTextEntryVisible)}
                    className="bg-muted/80 backdrop-blur-sm border-primary/20 hover:bg-muted"
                >
                    <MessageSquare className="mr-2" />
                    {isTextEntryVisible ? 'Hide Text Input' : 'Show Text Input'}
                </Button>
                {isTextEntryVisible && (
                    <div className="animate-in fade-in duration-300 space-y-2">
                        {responseText && (
                            <Card className="bg-muted/80 backdrop-blur-sm border-primary/20 p-4">
                                <CardContent className="p-0">
                                    <p className="text-sm">{responseText}</p>
                                </CardContent>
                            </Card>
                        )}
                        <form onSubmit={handleSendText} className="flex gap-2">
                            <Input 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type a message..."
                                className="bg-muted/80 backdrop-blur-sm border-primary/20"
                            />
                            <Button type="submit" size="icon" disabled={!inputText.trim()}>
                                <Send />
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        )}
   </div>
 );
}
