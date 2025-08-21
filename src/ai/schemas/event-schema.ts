/**
 * @fileOverview Schemas for the trendy event finding flow.
 */

import { z } from 'genkit';

// Input schema for the event finding flow
export const FindTrendyEventsInputSchema = z.object({
  destination: z.string().describe('The destination city to search for events in (e.g., "Tokyo").'),
  videoTitle: z.string().describe('The title of the YouTube video for context.'),
});
export type FindTrendyEventsInput = z.infer<typeof FindTrendyEventsInputSchema>;

// Schema for a single event
export const EventSchema = z.object({
  name: z.string().describe('The name of the event.'),
  description: z.string().describe('A brief, helpful description of the event.'),
  url: z.string().url().describe('The source URL for more information about the event.'),
});

// Output schema containing a list of events
export const FindTrendyEventsOutputSchema = z.object({
  events: z.array(EventSchema).describe('A list of up to 5 recommended trendy and future events.'),
});
export type FindTrendyEventsOutput = z.infer<typeof FindTrendyEventsOutputSchema>;
