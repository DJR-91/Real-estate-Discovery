import { z } from 'genkit';

// Input schema for getting weather
export const GetWeatherInputSchema = z.object({
  location: z.string().describe('The city name to get the weather for (e.g., "Tokyo").'),
});

// Output schema for the weather conditions
export const GetWeatherOutputSchema = z.object({
  temperature: z.number().describe('The current temperature value.'),
  temperatureUnit: z.string().describe('The unit for the temperature (e.g., "C" or "F").'),
  conditionText: z.string().describe('A short description of the weather (e.g., "Clear", "Cloudy").'),
  windSpeed: z.number().describe('The wind speed value.'),
  windSpeedUnit: z.string().describe('The unit for wind speed (e.g., "km/h").'),
  humidity: z.number().describe('The humidity percentage as a decimal (e.g., 0.75 for 75%).'),
});

// TypeScript types derived from the Zod schemas
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;
export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;
