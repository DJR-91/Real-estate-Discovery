'use server';

/**
 * @fileOverview A flow that generates a travel itinerary from a YouTube video.
 *
 * - generateTravelItinerary - A function that accepts a YouTube video URL and returns a 3-day travel plan.
 */

import { ai } from '@/ai/genkit';
import { GenerateTravelItineraryInputSchema, GenerateTravelItineraryOutputSchema, type GenerateTravelItineraryInput, type GenerateTravelItineraryOutput } from '@/ai/schemas/travel-itinerary-schema';

export async function generateTravelItinerary(
  input: GenerateTravelItineraryInput
): Promise<GenerateTravelItineraryOutput> {
  return generateTravelItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTravelItineraryPrompt',
  input: { schema: GenerateTravelItineraryInputSchema },
  output: { schema: GenerateTravelItineraryOutputSchema },
  prompt: `You are an expert travel agent who creates detailed, exciting, and practical 3-day travel itineraries.
A user has provided a YouTube video about a travel destination.
Your task is to analyze the content of the video and generate a 3-day travel plan based on the locations, activities, and overall vibe presented.
For each day, provide a title and a set of activities for the morning and afternoon.
Each activity must include a name, a short description, and a category (restaurant, hotel, or attraction).
Ensure the recommendations are grounded in real-world information by using your search tool.

YouTube Video: {{media url=videoUrl}}`,
});

const generateTravelItineraryFlow = ai.defineFlow(
  {
    name: 'generateTravelItineraryFlow',
    inputSchema: GenerateTravelItineraryInputSchema,
    outputSchema: GenerateTravelItineraryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, {
        config: { tools: [{ google_search: {} }] }
    });
    if (!output) {
      throw new Error('Failed to generate itinerary. The model returned no output.');
    }
    return output;
  }
);
