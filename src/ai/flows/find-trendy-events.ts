'use server';

/**
 * @fileOverview A flow that finds trendy, upcoming events for a given destination,
 * grounded in real-time search data. It can optionally use a video summary
 * to tailor the search to a specific theme.
 */

import { ai } from '@/ai/genkit';
import { FindTrendyEventsInputSchema, FindTrendyEventsOutputSchema, type FindTrendyEventsInput, type FindTrendyEventsOutput } from '@/ai/schemas/event-schema';
import { generateGroundedResponse } from './generate-grounded-response';
import { z } from 'genkit';

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
    let theme = "General Interest";

    // Step 1: If a video summary is provided, use an LLM to extract a simple theme.
    if (input.videoSummary && input.videoSummary.trim() !== '') {
        const themeResponse = await ai.generate({
            model: 'googleai/gemini-2.5-flash-lite',
            prompt: `Based on the following summary of a travel video, what is a one or two-word theme for the trip (e.g., "Foodie trip", "Historic Adventure", "Mountain Trek")?
      
            Summary: "${input.videoSummary}"
      
            Theme:`,
            output: {
                schema: z.string().nullable(),
            },
        });
        
        const potentialTheme = themeResponse.output;
        if (potentialTheme && potentialTheme.trim() !== '') {
            theme = potentialTheme;
        }
    }

    // Step 2: Construct a detailed query for the grounded response flow using the theme.
    const groundedQuery = `Find a list of 5 trendy and interesting events happening in ${input.destination} related to the theme of "${theme}".

    You MUST ensure these events are happening in the near future (from today, ${new Date().toLocaleDateString()}, within the next 6 months). Do not include past events.

    For each event, provide:
    1. The name of the event.
    2. A one-sentence description of what it is and why a tourist would find it interesting.
    3. The direct URL to a webpage with more information about the event.
    `;

    // Step 3: Call the existing `generateGroundedResponse` flow to get a real-time, search-grounded answer.
    const groundedResult = await generateGroundedResponse({ query: groundedQuery });
    const rawTextResponse = groundedResult.response;

    if (!rawTextResponse) {
        throw new Error(`Could not find any upcoming events in ${input.destination}. The search returned no results.`);
    }

    // Step 4: Use another LLM call to reliably parse the unstructured text into the required structured JSON format.
    const parsingResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-lite',
        prompt: `Please parse the following text, which contains a list of events, and format it as a JSON object that conforms to the specified schema.
        
        Text to parse:
        ---
        ${rawTextResponse}
        ---
        `,
        output: {
            schema: FindTrendyEventsOutputSchema,
        },
    });
    
    const output = parsingResponse.output;

    if (!output || !output.events || output.events.length === 0) {
        throw new Error(`Failed to parse the event information from the search results.`);
    }

    return {
      events: output.events,
    };
  }
);
