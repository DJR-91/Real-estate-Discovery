'use server';
/**
 * @fileOverview A flow that generates a rich description for a given location.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateLocationDescriptionInputSchema,
    GenerateLocationDescriptionOutputSchema,
    type GenerateLocationDescriptionInput,
    type GenerateLocationDescriptionOutput
} from '@/ai/schemas/location-description-schema';


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
    const prompt = `Generate a rich, engaging, and descriptive paragraph for the following location, suitable for a travel app. Focus on what makes it special. Location: ${input.locationName}.`;

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
