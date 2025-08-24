
import type { GetWeatherOutput } from "@/ai/schemas/weather-schema";
import { WeatherDisplay } from "./weather-display";

interface VideoResultHeaderProps {
  destination: string;
  weather: GetWeatherOutput | null;
  isLoading: boolean;
}

export function VideoResultHeader({ destination, weather, isLoading }: VideoResultHeaderProps) {
  const title = destination === "Places of Interest" 
    ? "Places of Interest"
    : `Video Results for ${destination}`;
    
  const subTitle = destination === "Places of Interest"
    ? "Based on your search query"
    : "Select a video to generate an itinerary";

  return (
    <div className="flex justify-between items-center mb-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-headline text-primary">{title}</h2>
        <p className="text-sm text-muted-foreground">{subTitle}</p>
      </div>
      <WeatherDisplay weather={weather} isLoading={isLoading} />
    </div>
  );
}
