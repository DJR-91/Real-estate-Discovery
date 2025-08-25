
'use client';

import React, { createContext, useContext } from 'react';
import { useLiveAPI } from '@/hooks/use-live-api';
import { useLiveStore } from '@/store/live-store';

// Create a context to hold the store's state and actions, though we won't pass it directly.
const LiveAPIContext = createContext(null);

export function LiveAPIProvider({ children }: { children: React.ReactNode }) {
  // Initialize the hook. It will manage its own state via the Zustand store.
  useLiveAPI();

  return (
    <LiveAPIContext.Provider value={null}>
      {children}
    </LiveAPIContext.Provider>
  );
}

// Custom hook to access the Zustand store.
// This is now the primary way components should interact with the live state.
export function useLiveAPIContext() {
  return useLiveStore();
}
