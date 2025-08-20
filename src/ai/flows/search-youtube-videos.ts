'use server';

/**
 * @fileOverview A flow that searches for travel-related YouTube videos.
 *
 * This flow takes a destination and travel type, and uses the YouTube service
 * to find relevant videos to serve as travel inspiration.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchVideos } from '@/services/youtube';
import type { Video } from '@/lib/types';
import { SearchYoutubeVideosInputSchema, SearchYoutubeVideosOutputSchema, type SearchYoutubeVideosInput, type SearchYoutubeVideosOutput } from '@/ai/schemas/youtube-videos-schema';

export async function searchYoutubeVideos(
  input: SearchYoutubeVideosInput
): Promise<SearchYoutubeVideosOutput> {
  return searchYoutubeVideosFlow(input);
}

const searchYoutubeVideosFlow = ai.defineFlow(
  {
    name: 'searchYoutubeVideosFlow',
    inputSchema: SearchYoutubeVideosInputSchema,
    outputSchema: SearchYoutubeVideosOutputSchema,
  },
  async (input) => {
    const query = `${input.destination} ${input.travelType} travel guide`;
    const videos = await searchVideos(query);
    
    if (videos.length === 0) {
      throw new Error('Could not find any relevant YouTube videos for your query. Please try a different destination or travel style.');
    }

    return {
      videos,
    };
  }
);
