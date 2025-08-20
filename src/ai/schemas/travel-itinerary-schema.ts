/**
 * @fileOverview Schemas for the travel itinerary flow.
 *
 * - GenerateTravelItineraryInputSchema - The input schema for the generateTravelItinerary function.
 * - GenerateTravelItineraryOutputSchema - The output schema for the generateTravelItinerary function.
 * - GenerateTravelItineraryInput - The input type for the generateTravelItinerary function.
 * - GenerateTravelItineraryOutput - The return type for the generateTravelItinerary function.
 */

import { z } from 'genkit';

export const GenerateTravelItineraryInputSchema = z.object({
  videoUrl: z.string().url().describe('The URL of the YouTube travel video.'),
});
export type GenerateTravelItineraryInput = z.infer<
  typeof GenerateTravelItineraryInputSchema
>;

const ActivitySchema = z.object({
  name: z.string().describe('The name of the place or activity.'),
  description: z
    .string()
    .describe('A brief, one-sentence description of the place or activity.'),
  category: z
    .enum(['restaurant', 'hotel', 'attraction'])
    .describe('The category of the activity.'),
});

const DayPlanSchema = z.object({
  day: z.number().describe('The day number (1, 2, or 3).'),
  title: z.string().describe('A catchy title for the day\'s plan.'),
  morning: z
    .array(ActivitySchema)
    .describe('A list of activities for the morning.'),
  afternoon: z
    .array(ActivitySchema)
    .describe('A list of activities for the afternoon.'),
});

export const GenerateTravelItineraryOutputSchema = z.object({
  title: z.string().describe('The overall title for the travel itinerary.'),
  description: z
    .string()
    .describe('A short, one-paragraph summary of the trip.'),
  days: z
    .array(DayPlanSchema)
    .length(3)
    .describe('An array of exactly 3 daily plans.'),
});
export type GenerateTravelItineraryOutput = z.infer<
  typeof GenerateTravelItineraryOutputSchema
>;
