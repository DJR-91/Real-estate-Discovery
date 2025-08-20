import { Client, PlaceInputType } from "@googlemaps/google-maps-services-js";
import { ai } from "@/ai/genkit";
import { z } from "zod";

const mapsClient = new Client({});

const findPlaceToolSchema = z.object({
  query: z.string(),
});

export const findPlaceTool = ai.defineTool(
    {
      name: 'findPlace',
      description: 'Finds a place and returns its address and a photo.',
      inputSchema: findPlaceToolSchema,
      outputSchema: z.object({
        address: z.string().optional(),
        imageUrl: z.string().nullable().optional(),
      }),
    },
    async (input) => {
      const { query } = input;
  
      try {
        const findPlaceResponse = await mapsClient.findPlaceFromText({
          params: {
            input: query,
            inputtype: PlaceInputType.textQuery,
            fields: ['place_id', 'formatted_address', 'name', 'photos'],
            key: process.env.GOOGLE_MAPS_API_KEY!,
          },
        });
  
        const candidate = findPlaceResponse.data.candidates?.[0];
  
        if (!candidate || !candidate.place_id) {
          throw new Error(`No place found for query: "${query}"`);
        }
  
        let imageUrl = null;
        if (candidate.photos && candidate.photos.length > 0) {
          const photoReference = candidate.photos[0].photo_reference;
          // The photo URL is constructed this way, as per Google Maps Places API docs.
          imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${process.env.GOOGLE_MAPS_API_KEY!}`;
        }
  
        return {
          address: candidate.formatted_address,
          imageUrl,
        };
      } catch (error) {
        console.error(`Google Maps API error for query "${query}":`, error);
        // Re-throw the error so it can be handled by the calling flow.
        throw new Error(`Failed to retrieve place details from Google Maps for: "${query}"`);
      }
    }
  );
  