import type { GetWeatherOutput } from "@/ai/schemas/weather-schema";
import { Skeleton } from "./ui/skeleton";
import { WifiOff } from "lucide-react";

interface WeatherDisplayProps {
    weather: GetWeatherOutput | undefined;
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
        return <Skeleton className="w-48 h-24 rounded-lg" />;
    }
    
    if (!weather) {
        return (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-4 border rounded-lg w-48 h-24">
                <WifiOff className="h-6 w-6 mb-1" />
                <p className="text-xs text-center">Weather data unavailable</p>
            </div>
        );
    }
    
    const icon = getWeatherIcon(weather.conditionText);

    return (
        <div className="p-3 border rounded-lg shadow-sm bg-background w-48">
            <div className="flex items-center justify-between">
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
            <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-2">
                <div className="text-center">
                    <span className="font-medium">Wind</span> {Math.round(weather.windSpeed)} {weather.windSpeedUnit}
                </div>
                <div className="text-center">
                    <span className="font-medium">Humidity</span> {Math.round(weather.humidity * 100)}%
                </div>
            </div>
        </div>
    );
}
