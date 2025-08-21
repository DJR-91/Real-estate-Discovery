import type { FindTrendyEventsOutput } from "@/ai/schemas/event-schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PartyPopper, Link as LinkIcon } from "lucide-react";

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
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-start gap-3">
                <PartyPopper className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <span>{event.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{event.description}</p>
            </CardContent>
            <CardFooter>
                <Button asChild variant="outline">
                    <a href={event.url} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Learn More
                    </a>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
