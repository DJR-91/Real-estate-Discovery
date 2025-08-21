'use server';

/**
 * @fileOverview A flow that finds trendy, upcoming events for a given destination,
 * grounded in real-time search data to ensure relevance and timeliness.
 */

import { ai } from '@/ai/genkit';
import { FindTrendyEventsInputSchema, FindTrendyEventsOutputSchema, type FindTrendyEventsInput, type FindTrendyEventsOutput } from '@/ai/schemas/event-schema';
import { z } from 'zod';

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
    // Enable the Google Search tool for grounding
    const config = {
      tools: [{ google_search: {} }],
    };

    const prompt = `Based on the travel video titled "${input.videoTitle}", find a list of 5 trendy and interesting events happening in ${input.destination}.

    Crucially, you MUST ensure these events are happening in the near future (within the next 6 months). Do not include past events.

    For each event, provide:
    1. A short, catchy name.
    2. A one-sentence description explaining what it is and why it's interesting for a tourist.
    3. The source URL where the user can find more information.
    `;

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      config,
      output: {
        schema: FindTrendyEventsOutputSchema,
      },
    });
    
    const output = llmResponse.output;

    if (!output || !output.events || output.events.length === 0) {
        throw new Error(`Could not find any upcoming events in ${input.destination}.`);
    }

    return {
      events: output.events,
    };
  }
);
