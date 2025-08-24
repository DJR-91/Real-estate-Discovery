'use server';

/**
 * @fileOverview A flow that generates a grounded response based on a search query using the Gemini API and Google Search grounding tool.
 *
 * - generateGroundedResponse - A function that accepts a search query and returns a grounded response with citations.
 */

import {ai} from '@/ai/genkit';
import { GenerateGroundedResponseInputSchema, GenerateGroundedResponseOutputSchema, type GenerateGroundedResponseInput, type GenerateGroundedResponseOutput } from '@/ai/schemas/grounded-response-schema';
import { googleAI } from '@genkit-ai/googleai';

export async function generateGroundedResponse(input: GenerateGroundedResponseInput): Promise<GenerateGroundedResponseOutput> {
  return generateGroundedResponseFlow(input);
}

const generateGroundedResponseFlow = ai.defineFlow(
  {
    name: 'generateGroundedResponseFlow',
    inputSchema: GenerateGroundedResponseInputSchema,
    outputSchema: GenerateGroundedResponseOutputSchema,
  },
  async (input) => {
    const config = {
      tools: [{ google_search: {} }],
    };

    const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-lite',
        prompt: input.query,
        config
    });

    const text = response.text;
    const groundingMetadata = response.groundingMetadata;

    return {
      response: text,
      webSearchQueries: groundingMetadata?.webSearchQueries,
      groundingChunks: groundingMetadata?.groundingChunks,
      groundingSupports: groundingMetadata?.groundingSupports
    };
  }
);
