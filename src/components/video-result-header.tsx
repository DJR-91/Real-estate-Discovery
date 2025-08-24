
import type { GetWeatherOutput } from "@/ai/schemas/weather-schema";
import { WeatherDisplay } from "./weather-display";

interface VideoResultHeaderProps {
  destination: string;
  weather: GetWeatherOutput | null;
  isLoading: boolean;
}

export function VideoResultHeader({ destination, weather, isLoading }: VideoResultHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-headline text-primary">Video Results for {destination}</h2>
        <p className="text-sm text-muted-foreground">Select a video to generate an itinerary</p>
      </div>
      <WeatherDisplay weather={weather} isLoading={isLoading} />
    </div>
  );
}
