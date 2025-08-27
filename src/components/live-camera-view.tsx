
'use client';

import React from 'react';
import { useLiveAPIContext } from '@/context/live-api-context';
import { Mic, MicOff, Power, Video, Send, Loader, VideoOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Input } from './ui/input';
import { LiveVideoDisplay } from './live-video-display';
import type { ItineraryData } from '@/app/page';
import { useLiveStore } from '@/store/live-store';

interface LiveCameraViewProps {
    itineraryData: ItineraryData;
}

export function LiveCameraView({ itineraryData }: LiveCameraViewProps) {
  const { connect, disconnect, send } = useLiveAPIContext();
  const { connected, text, error, isSpeaking, isListening, volume, micActive, toggleMic, cameraActive, toggleCamera } = useLiveStore();
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

  return null;
}
