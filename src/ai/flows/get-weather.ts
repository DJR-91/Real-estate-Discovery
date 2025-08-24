'use server';
/**
 * @fileOverview A flow that fetches the current weather conditions for a given location.
 */

import { ai } from '@/ai/genkit';
import { GetWeatherInputSchema, GetWeatherOutputSchema, type GetWeatherInput, type GetWeatherOutput } from '@/ai/schemas/weather-schema';
import { geocodeTool } from '@/services/google-maps';

export async function getWeather(input: GetWeatherInput): Promise<GetWeatherOutput | null> {
  return getWeatherFlow(input);
}

const getWeatherFlow = ai.defineFlow(
  {
    name: 'getWeatherFlow',
    inputSchema: GetWeatherInputSchema,
    outputSchema: GetWeatherOutputSchema.nullable(),
  },
  async (input) => {
    // Step 1: Geocode the location name to get latitude and longitude.
    const { latitude, longitude } = await geocodeTool({ address: input.location });

    // Step 2: Call the Google Weather API.
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key is not configured.");
    }
    
    const apiUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${latitude}&location.longitude=${longitude}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
        const errorData = await response.json();
        // If the error is that data is not supported, return null gracefully.
        if (errorData.error?.message.includes('not supported for this location')) {
            console.warn(`Weather data not available for ${input.location}`);
            return null;
        }
        throw new Error(errorData.error?.message || `Weather API call failed with status: ${response.status}`);
    }

    const weatherData = await response.json();

    if (!weatherData.currentConditions) {
        // Handle cases where the API returns a 200 OK but no data.
        console.warn(`The weather API response did not contain current conditions for ${input.location}.`);
        return null;
    }

    // Step 3: Format the response to match our output schema.
    const conditions = weatherData.currentConditions;
    return {
        temperature: conditions.temperature?.value || 0,
        temperatureUnit: conditions.temperature?.units || 'C',
        conditionText: conditions.weather || 'Unknown',
        windSpeed: conditions.wind?.speed?.value || 0,
        windSpeedUnit: conditions.wind?.speed?.units || 'km/h',
        humidity: conditions.humidity?.value || 0,
    };
  }
);
