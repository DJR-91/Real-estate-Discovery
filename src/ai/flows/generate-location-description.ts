'use server';
/**
 * @fileOverview A flow that generates a rich description for a given location.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateLocationDescriptionInputSchema = z.object({
  locationName: z.string().describe('The name of the location (e.g., "Eiffel Tower, Paris").'),
  latitude: z.number(),
  longitude: z.number(),
});
export type GenerateLocationDescriptionInput = z.infer<typeof GenerateLocationDescriptionInputSchema>;

export const GenerateLocationDescriptionOutputSchema = z.object({
  description: z.string().describe('A rich, engaging paragraph describing the location.'),
});
export type GenerateLocationDescriptionOutput = z.infer<typeof GenerateLocationDescriptionOutputSchema>;

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
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt,
      output: { schema: GenerateLocationDescriptionOutputSchema },
    });

    const output = result.output();
    if (!output) {
      throw new Error('Failed to generate a location description.');
    }
    return output;
  }
);
