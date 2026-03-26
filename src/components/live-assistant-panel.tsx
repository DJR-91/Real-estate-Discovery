'use client';

import React, { useState } from 'react';
import { useLiveAPIContext } from '@/context/live-api-context';
import { useLiveStore } from '@/store/live-store';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, Play, Pause, MessageSquare, Terminal } from 'lucide-react';

export default function LiveAssistantPanel() {
    const { connect, disconnect, send } = useLiveAPIContext();
    const store = useLiveStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleToggleConnection = async () => {
        if (store.connected) {
            disconnect();
        } else {
            // Pass active itinerary if available to start the tour
            if (store.itineraryData) {
                await connect(store.itineraryData);
            } else {
                await connect();
            }
        }
    };

    const handleToggleMic = () => {
        useLiveStore.setState({ micActive: !store.micActive });
    };

    const handleToggleCamera = () => {
        useLiveStore.setState({ cameraActive: !store.cameraActive });
    };

    const handleNextStop = () => {
        send({ text: "Next stop please" });
    };

    if (!isOpen) {
        return (
            <Button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-2xl bg-primary hover:bg-primary-dark border-4 border-white animate-bounce"
            >
                <Mic className="w-6 h-6 text-white" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-96 shadow-2xl border-2 border-border rounded-2xl overflow-hidden z-50 bg-background/95 backdrop-blur-md">
            <div className="p-4 border-b border-border flex justify-between items-center bg-primary/5">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${store.connected ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                    <h3 className="font-headline font-bold text-lg">Genius Tour Guide</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>✕</Button>
            </div>

            <div className="p-6 flex flex-col gap-4">
                {store.error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                        {store.error}
                    </div>
                )}

                <div className="flex justify-center gap-4 my-4">
                    <Button 
                        variant={store.connected ? "destructive" : "default"}
                        onClick={handleToggleConnection}
                        className="rounded-full px-6"
                    >
                        {store.connected ? "End Chat" : "Start Voice Tour"}
                    </Button>
                </div>

                {store.connected && (
                    <>
                        <div className="flex justify-center gap-3">
                            <Button 
                                variant={store.micActive ? "secondary" : "outline"}
                                size="icon"
                                onClick={handleToggleMic}
                                className={`rounded-full h-12 w-12 ${store.micActive && store.volume > 0.1 ? 'ring-2 ring-primary animate-pulse' : ''}`}
                            >
                                {store.micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </Button>
                            
                            <Button 
                                variant={store.cameraActive ? "secondary" : "outline"}
                                size="icon"
                                onClick={handleToggleCamera}
                                className="rounded-full h-12 w-12"
                            >
                                {store.cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </Button>
                        </div>

                        <div className="mt-4 p-3 bg-muted/30 rounded-lg min-h-[80px] flex flex-col justify-between">
                            <div className="text-sm text-muted-foreground italic">
                                {store.isSpeaking ? "Guide is speaking..." : store.isListening ? "Listening..." : "Ready"}
                            </div>
                            {store.text && (
                                <div className="text-sm font-medium mt-1 max-h-32 overflow-y-auto">
                                    {store.text}
                                </div>
                            )}
                        </div>

                        <Button 
                            onClick={handleNextStop}
                            variant="outline" 
                            className="w-full mt-2 flex items-center gap-2 justify-center"
                        >
                            <Play className="w-4 h-4" /> Say "Next Stop"
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
}
