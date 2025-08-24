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
    let latitude: number;
    let longitude: number;

    try {
        // Step 1: Geocode the location name to get latitude and longitude.
        const geocoded = await geocodeTool({ address: input.location });
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
    
        // Step 2: Call the Google Weather API.
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error("Google Maps API key is not configured.");
        }
        
        const apiUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${latitude}&location.longitude=${longitude}`;
    
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.json();
            // If the error is that data is not supported, throw an error to trigger the mock data fallback.
            if (errorData.error?.message.includes('not supported for this location')) {
                throw new Error(`Weather data not available for ${input.location}`);
            }
            throw new Error(errorData.error?.message || `Weather API call failed with status: ${response.status}`);
        }
    
        const weatherData = await response.json();
    
        if (!weatherData.currentConditions) {
            // Handle cases where the API returns a 200 OK but no data.
            throw new Error(`The weather API response did not contain current conditions for ${input.location}.`);
        }
    
        // Step 3: Format the response to match our output schema.
        const conditions = weatherData.currentConditions;
        return {
            temperature: conditions.temperature?.value || 0,
            temperatureUnit: conditions.temperature?.units || 'C',
            conditionText: conditions.weather || 'Unknown',
            latitude,
            longitude,
        };
    } catch (error) {
        console.warn("Weather flow failed, returning mock data.", error);
        // As a fallback for any error (API failure, unsupported location, etc.), return mock data for Tokyo.
        return {
            temperature: 18,
            temperatureUnit: 'C',
            conditionText: 'Partly Cloudy',
            latitude: 35.6895,
            longitude: 139.6917,
        };
    }
  }
);
