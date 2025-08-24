
'use client';


import React, { createContext, useContext } from 'react';
import { useLiveAPI, UseLiveAPIResults } from '@/hooks/use-live-api';


const LiveAPIContext = createContext<UseLiveAPIResults | undefined>(undefined);


export function LiveAPIProvider({ children }: { children: React.ReactNode }) {
 const liveAPI = useLiveAPI();
 return (
   <LiveAPIContext.Provider value={liveAPI}>
     {children}
   </LiveAPIContext.Provider>
 );
}


export function useLiveAPIContext() {
 const context = useContext(LiveAPIContext);
 if (context === undefined) {
   throw new Error('useLiveAPIContext must be used within a LiveAPIProvider');
 }
 return context;
}
