
import type { GetWeatherOutput } from "@/ai/schemas/weather-schema";
import { Skeleton } from "./ui/skeleton";
import { WifiOff } from "lucide-react";
import { Separator } from "./ui/separator";

interface WeatherDisplayProps {
    weather: GetWeatherOutput | null | undefined;
    isLoading: boolean;
}

const weatherIcons: { [key: string]: string } = {
    'clear': '☀️',
    'partly-cloudy': '⛅️',
    'cloudy': '☁️',
    'rain': '🌧️',
    'snow': '❄️',
    'thunderstorm': '⛈️',
    'fog': '🌫️',
    'windy': '💨',
    'haze': '🌫️',
    'mostly-clear': '🌤️',
    'mostly-cloudy': '🌥️',
    'scattered-showers': '🌦️',
    'scattered-thunderstorms': '⛈️',
};
  
function getWeatherIcon(conditionText: string): string {
    const normalizedText = conditionText.toLowerCase().replace(/ /g, '-');
    for (const key in weatherIcons) {
      if (normalizedText.includes(key)) {
        return weatherIcons[key];
      }
    }
    return '🌎'; // Default icon
}

export function WeatherDisplay({ weather, isLoading }: WeatherDisplayProps) {
    if (isLoading) {
        return <Skeleton className="w-48 h-28 rounded-lg" />;
    }
    
    if (!weather) {
        return (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-4 border rounded-lg w-48 h-28">
                <WifiOff className="h-6 w-6 mb-1" />
                <p className="text-xs text-center">Weather data unavailable</p>
            </div>
        );
    }
    
    const icon = getWeatherIcon(weather.conditionText);

    return (
        <div className="p-3 border rounded-lg shadow-sm bg-background w-48">
            <div className="flex items-center justify-center">
                <div className="flex items-center">
                    <div className="text-4xl">{icon}</div>
                    <div className="ml-2">
                        <div className="text-2xl font-bold">
                            {Math.round(weather.temperature)}°{weather.temperatureUnit}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize truncate" title={weather.conditionText}>
                            {weather.conditionText}
                        </div>
                    </div>
                </div>
            </div>
            {weather.latitude && weather.longitude && (
                <>
                    <Separator className="my-2" />
                    <div className="text-center text-xs text-muted-foreground">
                        {`Lat: ${weather.latitude.toFixed(4)}, Lon: ${weather.longitude.toFixed(4)}`}
                    </div>
                </>
            )}
        </div>
    );
}
