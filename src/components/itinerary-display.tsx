import type { ItineraryData } from "@/app/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, MapPin, Utensils, FerrisWheel, Hotel, Loader } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";

interface ItineraryDisplayProps {
  data: ItineraryData;
  onFindHotels: (destination: string) => void;
  isHotelLoading: boolean;
}

const locationIcons: { [key: string]: React.ReactNode } = {
  restaurant: <Utensils className="h-5 w-5 text-accent" />,
  hotel: <Building className="h-5 w-5 text-accent" />,
  landmark: <FerrisWheel className="h-5 w-5 text-accent" />,
  default: <MapPin className="h-5 w-5 text-accent" />,
};

function getIconForLocation(name: string): React.ReactNode {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("restaurant") || lowerName.includes("cafe") || lowerName.includes("food")) {
    return locationIcons.restaurant;
  }
  if (lowerName.includes("hotel") || lowerName.includes("inn") || lowerName.includes("lodging")) {
    return locationIcons.hotel;
  }
  if (lowerName.includes("park") || lowerName.includes("museum") || lowerName.includes("temple") || lowerName.includes("shrine") || lowerName.includes("tower") || lowerName.includes("market")) {
    return locationIcons.landmark;
  }
  return locationIcons.default;
}

export function ItineraryDisplay({ data, onFindHotels, isHotelLoading }: ItineraryDisplayProps) {
  const { video, itinerary, bannerUrl, destination } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="shadow-lg overflow-hidden">
         {bannerUrl && (
          <div className="relative w-full h-[300px]">
            <Image
              src={bannerUrl}
              alt="AI-generated itinerary banner"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint="travel banner"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">Your 3-Day Itinerary</CardTitle>
          <CardDescription>
            Inspired by the YouTube video:{" "}
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
              {video.title}
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <a href={video.url} target="_blank" rel="noopener noreferrer">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  width={480}
                  height={360}
                  className="rounded-lg object-cover w-full aspect-video transition-transform hover:scale-105"
                  data-ai-hint="youtube thumbnail"
                />
              </a>
            </div>
            <div className="md:col-span-2 space-y-6">
              {itinerary.map((day) => (
                <div key={day.day}>
                  <Badge variant="secondary" className="text-lg py-1 px-4 mb-2">
                    Day {day.day}
                  </Badge>
                  <h3 className="text-2xl font-semibold font-headline text-primary/90">
                    {day.title}
                  </h3>
                  <Separator className="my-2" />
                  <div className="space-y-4">
                    {day.locations.map((location, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="flex-shrink-0 mt-1">
                          {getIconForLocation(location.name)}
                        </div>
                        <div className="w-full">
                          <p className="font-bold text-lg">{location.name}</p>
                          <p className="text-muted-foreground">{location.description}</p>
                          {location.address && (
                             <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {location.address}
                             </p>
                          )}
                          {location.imageUrl && (
                            <div className="relative h-32 w-full mt-2 rounded-lg overflow-hidden">
                              <Image
                                src={location.imageUrl}
                                alt={location.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                data-ai-hint="tourist location"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-6">
            <div className="w-full">
                <h3 className="font-headline text-xl text-primary mb-2">Ready to Book?</h3>
                <p className="text-muted-foreground mb-4">Find hotels and places to stay at your destination.</p>
                <Button onClick={() => onFindHotels(destination)} disabled={isHotelLoading}>
                    {isHotelLoading ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Hotel className="mr-2 h-4 w-4" />
                    )}
                    Find Hotels in {destination}
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
