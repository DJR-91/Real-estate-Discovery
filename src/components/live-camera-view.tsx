
'use client';

import React from 'react';
import { useLiveAPIContext } from '@/context/live-api-context';
import { Mic, Power, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function LiveCameraView() {
  const { connected, stream, text, error, isListening, isSpeaking, connect, disconnect, startListening, stopListening } = useLiveAPIContext();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className="shadow-lg w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="flex-shrink-0 relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-background overflow-hidden flex items-center justify-center border-2 border-primary/20">
              {stream ? (
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
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <div className="absolute inset-0 rounded-full bg-destructive/20 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full bg-destructive/20 animate-pulse delay-150"></div>
              </div>
            )}
             {isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse delay-150"></div>
              </div>
            )}
          </div>

          <div className="flex-grow w-full space-y-4 text-center sm:text-left">
            {!connected ? (
              <div>
                <p className="font-bold text-lg">Start Live Interaction</p>
                <p className="text-sm text-muted-foreground">Click the button to connect to Gemini.</p>
                <Button onClick={connect} className="mt-2">
                  <Video className="mr-2" />
                  Connect
                </Button>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                   {!isListening ? (
                    <Button onClick={startListening}>
                      <Mic className="mr-2" /> Start Listening
                    </Button>
                   ) : (
                    <Button onClick={stopListening} variant="destructive">
                      <Mic className="mr-2" /> Stop Listening
                    </Button>
                   )}
                  <Button onClick={disconnect} variant="outline" size="icon">
                    <Power className="h-5 w-5" />
                  </Button>
                </div>
                 {text && (
                    <Card className="bg-muted/80 backdrop-blur-sm border-primary/20 p-4 text-left">
                        <CardContent className="p-0">
                            <p className="text-sm">{text}</p>
                        </CardContent>
                    </Card>
                )}
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
