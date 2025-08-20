import type { GenerateItineraryOutput } from "@/ai/schemas/itinerary-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Building, Utensils, Mountain, Youtube } from "lucide-react";
import Image from "next/image";
import type { Video } from "@/lib/types";

interface ItineraryDisplayProps {
  data: GenerateItineraryOutput;
  video: Video;
}

const LocationIcon = ({ name }: { name: string }) => {
  const lowerCaseName = name.toLowerCase();
  if (lowerCaseName.includes('restaurant') || lowerCaseName.includes('cafe') || lowerCaseName.includes('market')) {
    return <Utensils className="h-5 w-5 text-accent" />;
  }
  if (lowerCaseName.includes('museum') || lowerCaseName.includes('temple') || lowerCaseName.includes('shrine') || lowerCaseName.includes('castle') || lowerCaseName.includes('tower')) {
    return <Building className="h-5 w-5 text-accent" />;
  }
  if (lowerCaseName.includes('park') || lowerCaseName.includes('garden') || lowerCaseName.includes('mountain')) {
      return <Mountain className="h-5 w-5 text-accent" />
  }
  return <MapPin className="h-5 w-5 text-accent" />;
};


export function ItineraryDisplay({ data, video }: ItineraryDisplayProps) {
  const { itinerary } = data;

  return (
    <div className="animate-in fade-in duration-500">
        <Card className="shadow-lg border-primary/20 mb-8">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-primary">
                Your AI-Generated Travel Itinerary
                </CardTitle>
                <CardDescription>
                This 3-day plan is based on the content of the YouTube video.
                </CardDescription>
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Video Thumbnail */}
            <div className="lg:col-span-1 space-y-4">
                <Card className="overflow-hidden shadow-lg">
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                    <div className="relative aspect-video">
                        <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Youtube className="h-16 w-16 text-white" />
                        </div>
                    </div>
                </a>
                <CardHeader>
                    <CardTitle className="text-xl">{video.title}</CardTitle>
                </CardHeader>
                </Card>
            </div>

            {/* Right Column: Itinerary Accordion */}
            <div className="lg:col-span-2">
                <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                    {itinerary.map((day, dayIndex) => (
                    <AccordionItem value={`item-${dayIndex}`} key={day.day} className="border-b-0 mb-4 rounded-lg overflow-hidden shadow-md bg-card">
                        <AccordionTrigger className="text-xl font-headline text-primary hover:no-underline px-6 py-4 bg-primary/5">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                                {day.day}
                            </div>
                            <span>{day.title}</span>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                        <div className="space-y-4 pt-4">
                            {day.locations.map((location, locIndex) => (
                            <Card key={locIndex} className="overflow-hidden shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-3">
                                <div className="md:col-span-1">
                                    {location.imageUrl ? (
                                        <div className="relative h-48 w-full">
                                        <Image
                                            src={location.imageUrl}
                                            alt={location.name}
                                            fill
                                            className="object-cover"
                                            data-ai-hint="location photo"
                                        />
                                        </div>
                                    ) : (
                                        <div className="h-48 w-full bg-muted flex items-center justify-center">
                                            <MapPin className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3">
                                            <LocationIcon name={location.name} />
                                            <span>{location.name}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                    <p className="text-muted-foreground mb-2">
                                        {location.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground/80">{location.address}</p>
                                    </CardContent>
                                </div>
                                </div>
                            </Card>
                            ))}
                        </div>
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    </div>
  );
}