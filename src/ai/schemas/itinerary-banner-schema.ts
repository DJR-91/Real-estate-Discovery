/**
 * @fileOverview Schemas for the itinerary banner generation flow.
 */

import { z } from 'genkit';

export const GenerateItineraryBannerInputSchema = z.object({
  videoTitle: z.string().describe('The title of the YouTube video.'),
  videoDescription: z.string().describe('The description of the YouTube video.'),
  destination: z.string().describe('The travel destination.'),
});
export type GenerateItineraryBannerInput = z.infer<typeof GenerateItineraryBannerInputSchema>;

export const GenerateItineraryBannerOutputSchema = z.object({
  bannerUrl: z.string().describe('The data URI of the generated banner image.'),
});
export type GenerateItineraryBannerOutput = z.infer<typeof GenerateItineraryBannerOutputSchema>;
