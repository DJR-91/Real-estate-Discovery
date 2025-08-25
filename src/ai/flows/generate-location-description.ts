'use server';
/**
 * @fileOverview A flow that generates a rich description for a given location,
 * grounded in Google Places API data, including user reviews.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateLocationDescriptionInputSchema,
    GenerateLocationDescriptionOutputSchema,
    type GenerateLocationDescriptionInput,
    type GenerateLocationDescriptionOutput
} from '@/ai/schemas/location-description-schema';
import { findPlaceTool } from '@/services/google-maps';


export async function generateLocationDescription(
  input: GenerateLocationDescriptionInput
): Promise<GenerateLocationDescriptionOutput> {
  return generateLocationDescriptionFlow(input);
}

const generateLocationDescriptionFlow = ai.defineFlow(
  {
    name: 'generateLocationDescriptionFlow',
    inputSchema: GenerateLocationDescriptionInputSchema,
    outputSchema: GenerateLocationDescriptionOutputSchema,
  },
  async (input) => {
    // Step 1: Use the findPlaceTool to get rich details, including reviews.
    const placeDetails = await findPlaceTool({ query: input.locationName });

    // Step 2: Construct a prompt that uses the reviews to generate a description.
    const reviewsText = placeDetails.reviews && placeDetails.reviews.length > 0
      ? `Here are some recent reviews to give you a sense of the place:\n${placeDetails.reviews.map(r => `- "${r}"`).join('\n')}`
      : "No recent reviews were available.";

    const prompt = `You are a friendly and engaging tour guide.
      Based on the following information and reviews for "${input.locationName}", please generate a short, one-paragraph introduction for a tourist.
      Summarize the general sentiment from the reviews and highlight what makes this place special.

      ${reviewsText}

      Your introduction:`;

    // Step 3: Call the LLM to generate the final description.
    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash-lite',
      prompt: prompt,
      output: { schema: GenerateLocationDescriptionOutputSchema },
    });

    const output = result.output;
    if (!output) {
      throw new Error('Failed to generate a location description.');
    }
    return output;
  }
);
