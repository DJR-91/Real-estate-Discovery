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
  latitude: z.number().optional().describe('The latitude used for the weather lookup.'),
  longitude: z.number().optional().describe('The longitude used for the weather lookup.'),
});

// TypeScript types derived from the Zod schemas
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;
export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;
