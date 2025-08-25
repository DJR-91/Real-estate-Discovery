
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '@/context/live-api-context';
import { cn } from '@/lib/utils';
import { Mic, Send, Video, MessageSquare, Power, Radio } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
   return <div className="h-10 w-40 p-2" />;
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
 const { connected, stream, connect, disconnect, send, text: responseText, isListening, startAudioTurn, stopAudioTurn, error } = useLiveAPIContext();
 const videoRef = useRef<HTMLVideoElement>(null);
 const [inputText, setInputText] = useState('');
 
 useEffect(() => {
   if (stream && videoRef.current) {
     videoRef.current.srcObject = stream;
   }
 }, [stream]);
 
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && connected) {
      send({ text: inputText });
      setInputText('');
    }
  };

 return (
    <Card className="shadow-lg max-w-4xl mx-auto">
        <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                
                <div className="flex-shrink-0 relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-background overflow-hidden flex items-center justify-center border-2 border-primary/20">
                        {connected && stream ? (
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover scale-x-[-1]"
                                autoPlay
                                playsInline
                                muted
                            />
                        ) : (
                            <Mic className="text-muted-foreground" size={48} />
                        )}
                    </div>
                     {isListening && (
                        <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 rounded-full">
                            <Radio className="text-destructive animate-pulse" size={32} />
                        </div>
                    )}
                </div>

                <div className="flex-grow w-full space-y-4">
                    {!connected ? (
                        <div className='text-center sm:text-left'>
                            <p className="font-bold text-lg">Start Live Interaction</p>
                            <p className="text-sm text-muted-foreground">Click the button to connect to Gemini and enable your camera and microphone.</p>
                            <Button onClick={connect} className="mt-2">
                                <Video className="mr-2" />
                                Connect
                            </Button>
                        </div>
                    ) : (
                       <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <Button 
                                    onMouseDown={startAudioTurn}
                                    onMouseUp={stopAudioTurn}
                                    onTouchStart={startAudioTurn}
                                    onTouchEnd={stopAudioTurn}
                                    variant={isListening ? "destructive" : "outline"}
                                    className="w-40"
                                >
                                    <Mic className="mr-2 h-4 w-4" />
                                    {isListening ? 'Listening...' : 'Push to Talk'}
                                </Button>
                                <Button onClick={disconnect} variant="ghost" size="icon">
                                    <Power className="h-5 w-5" />
                                </Button>
                                <VoiceVisualizer stream={stream} />
                            </div>
                           
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
                     {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTitle>Connection Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
 );
}
