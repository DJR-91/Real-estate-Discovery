import type { FindTrendyEventsOutput } from "@/ai/schemas/event-schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { CalendarDays, Clock, Link, MapPin, PartyPopper } from "lucide-react";

interface EventsDisplayProps {
  data: FindTrendyEventsOutput;
}

export function EventsDisplay({ data }: EventsDisplayProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
            <CardFooter>
              <a href={event.url} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="outline" className="w-full">
                  <Link className="mr-2 h-4 w-4" />
                  Learn More
                </Button>
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
