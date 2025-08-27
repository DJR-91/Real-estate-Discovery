import type { FindTrendyEventsOutput } from "@/ai/schemas/event-schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { CalendarDays, Clock, MapPin, PartyPopper, Star, Tag, Timer, PlusCircle, Wallet, CheckCircle, Award } from "lucide-react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface EventsDisplayProps {
  data: FindTrendyEventsOutput;
}

export function EventsDisplay({ data }: EventsDisplayProps) {
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      
      {/* Events Section */}
      {data.events && data.events.length > 0 && (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="font-headline text-3xl text-primary">Trendy Local Events</h2>
                <p className="text-muted-foreground">Discover what's happening at your destination.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.events.map((event, index) => (
                <Card key={index} className="shadow-lg flex flex-col justify-between">
                    <div>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-start gap-3">
                        <PartyPopper className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                        <span>{event.name}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                        <p className="text-muted-foreground">{event.description}</p>
                        <div className="space-y-2 text-sm pt-2">
                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-500" /> <span>{event.location}</span></p>
                            <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gray-500" /> <span>{event.date}</span></p>
                            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-500" /> <span>{event.time}</span></p>
                        </div>
                    </CardContent>
                    </div>
                </Card>
                ))}
            </div>
        </div>
      )}

      {/* Attractions and Tours Section */}
      {data.tours && data.tours.length > 0 && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="font-headline text-3xl text-primary">Attractions & Tours</h2>
            <p className="text-muted-foreground">Explore recommended activities and book your next adventure.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.tours.map((tour, index) => (
              <Card key={index} className="shadow-lg flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">{tour.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {tour.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{tour.description}</p>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-gray-500" /><span>Duration: {tour.duration}</span></div>
                        <div className="flex items-center gap-2"><Award className="h-4 w-4 text-gray-500" /><span>{tour.reviews.rating_text} ({tour.reviews.count})</span></div>
                        <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-gray-500" /><span>From ${tour.pricing.from_price.toFixed(2)}</span></div>
                        {tour.features.free_cancellation && <div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-4 w-4" /><span>Free Cancellation</span></div>}
                    </div>
                    <div className="flex items-center gap-2 text-sm pt-2"><CalendarDays className="h-4 w-4 text-gray-500" /><span>{tour.availability}</span></div>
                  </CardContent>
                </div>
                <CardFooter>
                    <Button variant="default" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add to Itinerary
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
