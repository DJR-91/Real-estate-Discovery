
"use client";

import * as React from "react";
import type { FindHotelsOutput, Hotel } from "@/ai/schemas/hotel-schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Building, MapPin, Play, Pause, PlusCircle } from "lucide-react";
import { Button } from "./ui/button";

interface HotelDisplayProps {
  data: FindHotelsOutput;
  onSelectHotel: (hotel: Hotel) => void;
}

export function HotelDisplay({ data, onSelectHotel }: HotelDisplayProps) {
  const audioUrl = "https://storage.cloud.google.com/jfk-files/outbound.wav?authuser=3";
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    // Initialize the audio object only on the client side
    if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
    }

    // Cleanup function to pause and nullify audio on component unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
  }, [audioUrl]);

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-6">
        <h2 className="font-headline text-3xl text-primary">Recommended Hotels</h2>
        <p className="text-muted-foreground">A selection of hotels at your destination.</p>
        <div className="mt-4 flex justify-center gap-4">
            <Button onClick={handlePlayAudio} variant="outline" disabled={isPlaying}>
                <Play className="mr-2 h-4 w-4" />
                AI Agent for Early Check Request
            </Button>
            <Button onClick={handlePauseAudio} variant="outline" disabled={!isPlaying}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
            </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.hotels.map((hotel, index) => (
          <Card key={index} className="shadow-lg overflow-hidden flex flex-col">
            <div className="relative w-full h-48">
              {hotel.imageUrl ? (
                <Image
                  src={hotel.imageUrl}
                  alt={`Photo of ${hotel.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  data-ai-hint="hotel exterior"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Building className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-xl">{hotel.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <p className="text-muted-foreground text-sm">{hotel.description}</p>
              <p className="text-sm text-gray-500 flex items-start gap-2 pt-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{hotel.address}</span>
              </p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button onClick={() => onSelectHotel(hotel)} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add to Itinerary
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

    