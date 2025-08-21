'use server';

/**
 * @fileOverview A flow that finds hotels near a given destination and provides descriptions.
 *
 * This flow takes a destination, uses a tool to search for nearby hotels via the Google Places API,
 * and then uses Gemini to generate a brief, helpful description for each hotel.
 */

import { ai } from '@/ai/genkit';
import { findNearbyHotelsTool } from '@/services/google-maps';
import { FindHotelsInputSchema, FindHotelsOutputSchema, type FindHotelsInput, type FindHotelsOutput } from '@/ai/schemas/hotel-schema';

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
    // Step 1: Use the tool to find a list of hotels from the Google Places API
    const hotelResults = await findNearbyHotelsTool({
      query: `hotels in ${input.destination}`,
    });

    if (hotelResults.length === 0) {
      throw new Error(`Could not find any hotels in ${input.destination}.`);
    }
    
    const hotelPlaceholders = hotelResults.map(hotel => ({...hotel, description: ''}));
    
    // Step 2: Use Gemini to generate a description for each hotel
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash-lite',
      output: {
        schema: FindHotelsOutputSchema,
      },
      prompt: [
        {
          text: `You are a travel assistant. For each of the following hotels in ${input.destination}, write a short, engaging, one-sentence description for a tourist.
        Focus on a key feature like its location, style, or a notable amenity.
        
        Hotels:
        ${hotelResults.map(h => `- ${h.name} at ${h.address}`).join('\n')}
        `,
        },
      ],
    });

    // Step 3: Combine the hotel details with the generated descriptions
    const hotelsWithDescriptions = llmResponse.output?.hotels.map((hotel, index) => {
        const originalHotel = hotelPlaceholders[index];
        return {
            ...originalHotel,
            description: hotel.description,
        };
    }) || hotelPlaceholders;
    

    return {
      hotels: hotelsWithDescriptions,
    };
  }
);
