'use server';

/**
 * @fileOverview A flow that finds trendy, upcoming events for a given destination,
 * grounded in real-time search data to ensure relevance and timeliness by leveraging
 * the existing `generateGroundedResponse` flow.
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

    // Step 1: Generate a theme from the video summary, but only if a summary exists.
    if (input.videoSummary && input.videoSummary.trim() !== '') {
        const themeResponse = await ai.generate({
            model: 'googleai/gemini-2.5-flash-lite',
            prompt: `Based on the following summary of a travel video, what is a one or two-word theme for the trip (e.g., "Foodie trip", "Historic Adventure", "Mountain Trek")?
      
            Summary:
            ---
            ${input.videoSummary}
            ---
      
            Theme:`,
            output: {
                schema: z.string(),
            },
        });
        theme = themeResponse.output || "General Interest";
    }

    // Step 2: Construct a detailed query for the grounded response flow using the theme.
    const groundedQuery = `Based on a trip to ${input.destination} with a theme of "${theme}", find a list of 5 trendy and interesting events happening in that city.

    Crucially, you MUST ensure these events are happening in the near future (within the next 6 months). Do not include past events.

    For each event, provide:
    1. The name of the event.
    2. A one-sentence description of what it is and why a tourist would find it interesting.
    3. The direct URL to a webpage with more information about the event.
    `;

    // Step 3: Call the existing `generateGroundedResponse` flow to get a text answer.
    const groundedResult = await generateGroundedResponse({ query: groundedQuery });
    const rawTextResponse = groundedResult.response;

    if (!rawTextResponse) {
        throw new Error(`Could not find any upcoming events in ${input.destination}. The grounded response was empty.`);
    }

    // Step 4: Use another LLM call to parse the unstructured text into the required structured JSON format.
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
        throw new Error(`Failed to parse the event information from the grounded response.`);
    }

    return {
      events: output.events,
    };
  }
);
