
/**
 * @fileOverview Schemas for the grounded response flow.
 */

import { z } from 'genkit';

export const GenerateGroundedResponseInputSchema = z.object({
  query: z
    .string()
    .describe(
      'The search query to be used for generating a grounded response.'
    ),
});
export type GenerateGroundedResponseInput = z.infer<
  typeof GenerateGroundedResponseInputSchema
>;

// Schema for a single Point of Interest (POI)
const PointOfInterestSchema = z.object({
  name: z.string().describe('The name of the point of interest.'),
  description: z
    .string()
    .describe('A brief description of the point of interest.'),
  address: z.string().describe('The full address of the point of interest.'),
  imageUrl: z
    .string()
    .nullable()
    .describe('A URL for a photo of the point of interest.'),
  rating: z.number().nullable().optional().describe('The rating of the place, from 1 to 5.'),
  userRatingCount: z.number().nullable().optional().describe('The total number of ratings.'),
});
export type PointOfInterest = z.infer<typeof PointOfInterestSchema>;

export const GenerateGroundedResponseOutputSchema = z.object({
  llmResponse: z
    .string()
    .describe('The original, conversational response from the language model.'),
  pointsOfInterest: z
    .array(PointOfInterestSchema)
    .describe('A list of structured points of interest.'),
});
export type GenerateGroundedResponseOutput = z.infer<
  typeof GenerateGroundedResponseOutputSchema
>;
