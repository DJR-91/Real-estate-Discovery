
'use server';

/**
 * @fileOverview A flow that finds trendy, upcoming events for a given destination.
 * This flow returns a mock list of events and does not use live search data.
 */

import { ai } from '@/ai/genkit';
import { FindTrendyEventsInputSchema, FindTrendyEventsOutputSchema, type FindTrendyEventsInput, type FindTrendyEventsOutput } from '@/ai/schemas/event-schema';

export async function findTrendyEvents(input: FindTrendyEventsInput): Promise<FindTrendyEventsOutput> {
  return findTrendyEventsFlow(input);
}

const findTrendyEventsFlow = ai.defineFlow(
  {
    name: 'findTrendyEventsFlow',
    inputSchema: FindTrendyEventsInputSchema,
    outputSchema: FindTrendyEventsOutputSchema,
  },
  async (input) => {
    // This flow now returns a static list of mock events.
    const mockEvents: FindTrendyEventsOutput = {
      events: [
        { name: 'Tokyo Ramen Show 2025', description: 'The largest outdoor ramen event in Japan, featuring famous shops from across the country. (Oct 2025)', url: 'https://example.com/ramen-show' },
        { name: 'Ginza Sake & Food Festival', description: 'Taste premium sake paired with gourmet bites from Ginza\'s top restaurants. (Oct 2025)', url: 'https://example.com/sake-fest' },
        { name: 'Autumn Truffle Week', description: 'Experience exclusive menus featuring the rare autumn truffle at fine dining establishments. (Oct 2025)', url: 'https://example.com/truffle-week' },
        { name: 'Christmas Market at Hibiya Park', description: 'Enjoy classic German-style Christmas food, hot wine, and festive decorations. (Dec 2025)', url: 'https://example.com/christmas-market' },
        { name: 'World Wagyu Expo', description: 'A massive celebration of Japanese beef, with tasting booths and cooking demonstrations. (Dec 2025)', url: 'https://example.com/wagyu-expo' },
        { name: 'Artisanal Mochi Pounding Festival', description: 'Join in the traditional new year preparations and taste freshly made mochi. (Dec 2025)', url: 'https://example.com/mochi-fest' },
      ]
    };

    return mockEvents;
  }
);
