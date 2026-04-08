import { z } from 'genkit';

export const GenerateLocationDescriptionInputSchema = z.object({
  locationName: z.string().describe('The name of the location (e.g., "Eiffel Tower, Paris").'),
});
export type GenerateLocationDescriptionInput = z.infer<typeof GenerateLocationDescriptionInputSchema>;

export const GenerateLocationDescriptionOutputSchema = z.object({
  description: z.string().describe('A rich, engaging paragraph describing the location.'),
});
export type GenerateLocationDescriptionOutput = z.infer<typeof GenerateLocationDescriptionOutputSchema>;
