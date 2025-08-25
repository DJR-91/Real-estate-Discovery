
'use client';

import React from 'react';
import { useLiveAPIContext } from '@/context/live-api-context';
import { Mic, MicOff, Power, Video, Send, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Input } from './ui/input';
import { LiveVideoDisplay } from './live-video-display';
import type { ItineraryData } from '@/app/page';

interface LiveCameraViewProps {
    itineraryData: ItineraryData;
}

export function LiveCameraView({ itineraryData }: LiveCameraViewProps) {
  const { connected, text, error, isSpeaking, isListening, volume, connect, disconnect, send } = useLiveAPIContext();
  const [inputValue, setInputValue] = React.useState('');

  const handleConnect = () => {
    if (!connected) {
      connect(itineraryData);
    } else {
      disconnect();
    }
  };

  const handleSendText = () => {
    if (inputValue.trim()) {
        send([{ text: inputValue }]);
        setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleSendText();
    }
  };

  const getStatusIndicator = () => {
    if (isSpeaking) {
      return (
        <div className="flex items-center gap-2 text-primary">
          <Loader className="animate-spin" />
          <span>Gemini is speaking...</span>
        </div>
      );
    }
    if (isListening) {
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Mic />
            <span>Listening</span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-75"
                    style={{ width: `${Math.min(volume * 100, 100)}%` }}
                />
            </div>
          </div>
        );
      }
    return (
        <div className="flex items-center gap-2 text-muted-foreground">
            <MicOff />
            <span>Not listening</span>
        </div>
    );
  };

  return (
    <Card className="shadow-lg w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="flex-shrink-0 relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-background overflow-hidden flex items-center justify-center border-2 border-primary/20">
              {connected ? (
                <LiveVideoDisplay />
              ) : (
                <Video className="text-muted-foreground" size={48} />
              )}
            </div>
            {(isSpeaking || isListening) && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse delay-150"></div>
              </div>
            )}
          </div>

          <div className="flex-grow w-full space-y-4 text-center sm:text-left">
            {!connected ? (
              <div>
                <p className="font-bold text-lg">Start Live Itinerary Tour</p>
                <p className="text-sm text-muted-foreground">Connect your camera and mic to start an interactive tour.</p>
                <Button onClick={handleConnect} className="mt-2">
                  <Video className="mr-2" />
                  Connect and Start Tour
                </Button>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className="flex items-center justify-center sm:justify-start gap-4">
                   <p className="font-bold text-lg text-green-600">Connected</p>
                   {getStatusIndicator()}
                  <Button onClick={disconnect} variant="destructive" size="icon" title="Disconnect">
                    <Power className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Or type 'next' to continue..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={!connected}
                    />
                    <Button onClick={handleSendText} disabled={!connected || !inputValue.trim()}>
                        <Send />
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
