'use server';

/**
 * @fileOverview A flow that finds hotels near a given destination and provides descriptions.
 *
 * This flow takes a destination, uses a tool to search for nearby hotels via the Google Places API,
 * and then uses Gemini to generate a brief, helpful description for each hotel.
 */

import { ai } from '@/ai/genkit';
import { findNearbyHotelsTool, findPlaceTool } from '@/services/google-maps';
import { FindHotelsInputSchema, FindHotelsOutputSchema, type FindHotelsInput, type FindHotelsOutput, HotelSchema } from '@/ai/schemas/hotel-schema';
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
    // Step 1: Use the tool to find a list of up to 6 hotels from the Google Places API
    const hotelResults = await findNearbyHotelsTool({
      query: `hotels in ${input.destination}`,
    });

    if (hotelResults.length === 0 && input.destination.toLowerCase() !== 'new york') {
      throw new Error(`Could not find any hotels in ${input.destination}.`);
    }

    // Step 2: Use Gemini to generate a description for each of the found hotels
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash-lite',
      output: {
        schema: z.object({
          hotels: z.array(z.object({ description: z.string() }))
        })
      },
      prompt: `You are a travel assistant. For each of the following hotels in ${input.destination}, write a short, engaging, one-sentence description for a tourist.
        Focus on a key feature like its location, style, or a notable amenity.
        
        Hotels:
        ${hotelResults.map(h => `- ${h.name} at ${h.address}`).join('\n')}
        `,
    });

    // Step 3: Combine the hotel details with the generated descriptions
    let hotelsWithDescriptions = llmResponse.output?.hotels.map((hotel, index) => {
        const originalHotel = hotelResults[index];
        return {
            ...originalHotel,
            description: hotel.description,
        };
    }) || hotelResults;
    
    // Step 4: Always add the InterContinental New York Barclay
    try {
        const intercontinentalDetails = await findPlaceTool({ query: "InterContinental New York Barclay, 111 E 48th St, New York, NY 10017" });
        hotelsWithDescriptions.push({
            name: "InterContinental New York Barclay",
            address: intercontinentalDetails.address || "111 E 48th St, New York, NY 10017",
            imageUrl: intercontinentalDetails.imageUrl || null,
            description: "A classic luxury hotel in the heart of Midtown Manhattan, offering timeless elegance and a prestigious address."
        });
    } catch (error) {
        console.error("Failed to fetch details for InterContinental New York Barclay:", error);
        // Add with mock details if API fails
        hotelsWithDescriptions.push({
            name: "InterContinental New York Barclay",
            address: "111 E 48th St, New York, NY 10017",
            imageUrl: "https://placehold.co/600x400.png",
            description: "A classic luxury hotel in the heart of Midtown Manhattan."
        });
    }


    return {
      hotels: hotelsWithDescriptions,
    };
  }
);
