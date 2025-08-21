import type { FindHotelsOutput } from "@/ai/schemas/hotel-schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
import { Building, MapPin, Play } from "lucide-react";
import { Button } from "./ui/button";

interface HotelDisplayProps {
  data: FindHotelsOutput;
}

export function HotelDisplay({ data }: HotelDisplayProps) {
  const audioUrl = "https://storage.cloud.google.com/jfk-files/outbound.wav?authuser=3";
  let audio: HTMLAudioElement | null = null;

  const handlePlayAudio = () => {
    if (!audio) {
      audio = new Audio(audioUrl);
    }
    audio.play();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="font-headline text-3xl text-primary">Recommended Hotels</h2>
        <p className="text-muted-foreground">A selection of hotels at your destination.</p>
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
            <CardFooter>
              <Button onClick={handlePlayAudio} variant="outline" className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Play Audio Clip
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
