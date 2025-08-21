/**
 * @fileOverview Schemas for the travel itinerary generation flow.
 */

import { z } from 'genkit';

export const GenerateItineraryInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to use as a source.'),
  videoTitle: z.string().describe('The title of the YouTube video.'),
  destination: z.string().describe('The travel destination (e.g., "Tokyo").'),
  travelType: z.string().describe('The style of travel (e.g., "Foodie", "Adventure Seeker").'),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;

export const LocationSchema = z.object({
  name: z.string().describe('The name of the location.'),
  description: z.string().describe('A brief description of the location and why it is recommended.'),
});

export const ItineraryDaySchema = z.object({
  day: z.number().describe('The day number (1, 2, or 3).'),
  title: z.string().describe('A creative title for the day\'s theme (e.g., "Cultural Immersion in Shibuya").'),
  locations: z.array(LocationSchema).describe('A list of locations to visit on this day.'),
});

const LocationWithDetailsSchema = LocationSchema.extend({
  address: z.string().optional().describe('The full physical address of the location, if available.'),
  imageUrl: z.string().nullable().optional().describe("A URL to a photo of the location from the Google Places API."),
});

const ItineraryDayWithDetailsSchema = ItineraryDaySchema.extend({
    locations: z.array(LocationWithDetailsSchema)
});

export const GenerateItineraryOutputSchema = z.object({
  itinerary: z.array(ItineraryDayWithDetailsSchema).describe('The 3-day itinerary.'),
  videoSummary: z.string().describe('A concise summary of the YouTube video used as a source.'),
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;
