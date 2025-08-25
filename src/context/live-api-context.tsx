
'use client';

import React, { createContext, useContext } from 'react';
import { useLiveAPI } from '@/hooks/use-live-api';
import { useLiveStore } from '@/store/live-store';
import type { LiveSession, Part } from '@google/genai';
import type { ItineraryData } from '@/app/page';

type LiveAPIContextType = {
    connect: (data?: ItineraryData) => Promise<void>;
    disconnect: () => void;
    send: (parts: Part | Part[]) => void;
    connected: boolean;
    stream: MediaStream | null;
    error: string | null;
    text: string;
    isListening: boolean;
    isSpeaking: boolean;
    volume: number;
};

const LiveAPIContext = createContext<LiveAPIContextType | null>(null);

export function LiveAPIProvider({ children }: { children: React.ReactNode }) {
  const api = useLiveAPI();

  return (
    <LiveAPIContext.Provider value={api}>
      {children}
    </LiveAPIContext.Provider>
  );
}

export function useLiveAPIContext() {
    const context = useContext(LiveAPIContext);
    if (!context) {
        throw new Error('useLiveAPIContext must be used within a LiveAPIProvider');
    }
    return context;
}
