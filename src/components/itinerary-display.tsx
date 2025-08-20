import * as React from "react";
import type { GenerateTravelItineraryOutput } from "@/ai/schemas/travel-itinerary-schema";
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
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Utensils, Hotel, FerrisWheel, Sun, Moon } from "lucide-react";

interface ItineraryDisplayProps {
  data: GenerateTravelItineraryOutput;
}

const categoryIcons: { [key: string]: React.ReactNode } = {
  restaurant: <Utensils className="h-4 w-4" />,
  hotel: <Hotel className="h-4 w-4" />,
  attraction: <FerrisWheel className="h-4 w-4" />,
  default: <MapPin className="h-4 w-4" />,
};

export function ItineraryDisplay({ data }: ItineraryDisplayProps) {
  const { title, description, days } = data;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>

      <Accordion type="single" collapsible defaultValue="day-1" className="w-full">
        {days.map((day, index) => (
          <AccordionItem key={index} value={`day-${index + 1}`}>
            <AccordionTrigger>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-lg font-bold text-accent">
                  <Calendar className="h-5 w-5" />
                  <span>Day {day.day}</span>
                </div>
                <h3 className="text-xl font-semibold text-primary/90">{day.title}</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pl-4 border-l-2 border-accent ml-2 py-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <Sun className="h-5 w-5 text-yellow-500" />
                        <span>Morning</span>
                    </div>
                    {day.morning.map((activity, actIndex) => (
                    <Card key={actIndex} className="ml-8">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {categoryIcons[activity.category] || categoryIcons.default}
                            {activity.name}
                        </CardTitle>
                        <CardDescription>
                            <Badge variant="secondary">{activity.category}</Badge>
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                        <p>{activity.description}</p>
                        </CardContent>
                    </Card>
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <Moon className="h-5 w-5 text-blue-500" />
                        <span>Afternoon</span>
                    </div>
                    {day.afternoon.map((activity, actIndex) => (
                    <Card key={actIndex} className="ml-8">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {categoryIcons[activity.category] || categoryIcons.default}
                            {activity.name}
                        </CardTitle>
                        <CardDescription>
                            <Badge variant="secondary">{activity.category}</Badge>
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                        <p>{activity.description}</p>
                        </CardContent>
                    </Card>
                    ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
