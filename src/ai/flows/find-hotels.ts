'use server';

/**
 * @fileOverview A flow that finds hotels near a given location and provides descriptions.
 *
 * This flow takes a latitude/longitude, uses a tool to search for nearby hotels via the Google Places API,
 * and then uses Gemini to generate a brief, helpful description for each hotel.
 */

import { ai } from '@/ai/genkit';
import { findPlaceTool, findNearbyPlacesTool } from '@/services/google-maps';
import { FindHotelsInputSchema, FindHotelsOutputSchema, type FindHotelsInput, type FindHotelsOutput } from '@/ai/schemas/hotel-schema';
import { z } from 'genkit';

// The main exported function that clients will call
export async function findHotels(input: FindHotelsInput): Promise<FindHotelsOutput> {
  return findHotelsFlow(input);
}

const findHotelsFlow = ai.defineFlow(
  {
    name: 'findHotelsFlow',
    inputSchema: FindHotelsInputSchema,
    outputSchema: FindHotelsOutputSchema,
  },
  async (input) => {
    const RADIUS_IN_METERS = 4828; // Approximately 3 miles

    // Step 1: Use the tool to find a list of up to 6 hotels from the Google Places API
    const hotelResults = await findNearbyPlacesTool({
      latitude: input.latitude,
      longitude: input.longitude,
      radius: RADIUS_IN_METERS,
      type: 'lodging'
    });

    if (hotelResults.length === 0) {
      // Even if no hotels are found nearby, we can still return the InterContinental
      console.warn(`Could not find any hotels near the specified location.`);
    }

    // Step 2: Use Gemini to generate a description for each of the found hotels
    let hotelsWithDescriptions = [];
    if (hotelResults.length > 0) {
        const llmResponse = await ai.generate({
          model: 'googleai/gemini-2.5-flash-lite',
          output: {
            schema: z.object({
              hotels: z.array(z.object({ description: z.string() }))
            })
          },
          prompt: `You are a travel assistant. For each of the following hotels, write a short, engaging, one-sentence description for a tourist.
            Focus on a key feature like its location, style, or a notable amenity.
            
            Hotels:
            ${hotelResults.map(h => `- ${h.name} at ${h.address}`).join('\n')}
            `,
        });
    
        // Step 3: Combine the hotel details with the generated descriptions
        hotelsWithDescriptions = llmResponse.output?.hotels.map((hotel, index) => {
            const originalHotel = hotelResults[index];
            return {
                ...originalHotel,
                description: hotel.description,
            };
        }) || hotelResults;
    }
    
    



    return {
      hotels: hotelsWithDescriptions.slice(0,7),
    };
  }
);
