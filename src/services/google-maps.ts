
import { Client, PlaceInputType, GeocodeResponse, GeocodeRequest, TextSearchRequest, Place } from "@googlemaps/google-maps-services-js";
import { ai } from "@/ai/genkit";
import { z } from "zod";

const mapsClient = new Client({});

const findPlaceToolSchema = z.object({
  query: z.string(),
});

export const findPlaceTool = ai.defineTool(
    {
      name: 'findPlace',
      description: 'Finds a place and returns its address, photo, rating, and recent reviews.',
      inputSchema: findPlaceToolSchema,
      outputSchema: z.object({
        address: z.string().optional(),
        imageUrl: z.string().nullable().optional(),
        rating: z.number().nullable().optional(),
        userRatingCount: z.number().nullable().optional(),
        reviews: z.array(z.string()).optional(),
      }),
    },
    async (input) => {
      const { query } = input;
  
      try {
        const findPlaceResponse = await mapsClient.findPlaceFromText({
          params: {
            input: query,
            inputtype: PlaceInputType.textQuery,
            fields: ['place_id'],
            key: process.env.GOOGLE_MAPS_API_KEY!,
          },
        });
  
        const candidate = findPlaceResponse.data.candidates?.[0];
  
        if (!candidate || !candidate.place_id) {
          throw new Error(`No place found for query: "${query}"`);
        }

        const detailsResponse = await mapsClient.placeDetails({
            params: {
                place_id: candidate.place_id,
                fields: ['formatted_address', 'name', 'photos', 'rating', 'user_ratings_total', 'reviews'],
                key: process.env.GOOGLE_MAPS_API_KEY!,
            }
        });

        const placeDetails = detailsResponse.data.result;

        if (!placeDetails) {
            throw new Error(`Could not retrieve details for place_id: ${candidate.place_id}`);
        }
  
        let imageUrl = null;
        if (placeDetails.photos && placeDetails.photos.length > 0) {
          const photoReference = placeDetails.photos[0].photo_reference;
          imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${process.env.GOOGLE_MAPS_API_KEY!}`;
        }

        const reviews = placeDetails.reviews?.map(r => r.text).slice(0, 3) || []; // Get up to 3 reviews
  
        return {
          address: placeDetails.formatted_address,
          imageUrl,
          rating: placeDetails.rating ?? null,
          userRatingCount: placeDetails.user_ratings_total ?? null,
          reviews: reviews,
        };
      } catch (error) {
        console.error(`Google Maps API error for query "${query}":`, error);
        throw new Error(`Failed to retrieve place details from Google Maps for: "${query}"`);
      }
    }
  );

  const geocodeToolSchema = z.object({
    address: z.string().describe("The address to geocode."),
  });
  
  export const geocodeTool = ai.defineTool(
    {
      name: 'geocode',
      description: 'Geocodes a street address into latitude and longitude.',
      inputSchema: geocodeToolSchema,
      outputSchema: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    },
    async (input) => {
      const { address } = input;
      const request: GeocodeRequest = {
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      };
  
      try {
        const response: GeocodeResponse = await mapsClient.geocode(request);
        const { lat, lng } = response.data.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
      } catch (error) {
        console.error(`Geocoding error for address "${address}":`, error);
        throw new Error(`Failed to geocode address: "${address}"`);
      }
    }
  );

  const findNearbyHotelsToolSchema = z.object({
    query: z.string().describe('The search query for hotels, e.g., "hotels in Tokyo".'),
  });
  
  const hotelResultSchema = z.object({
    name: z.string(),
    address: z.string(),
    imageUrl: z.string().nullable(),
  });
  
  export const findNearbyHotelsTool = ai.defineTool({
      name: 'findNearbyHotels',
      description: 'Finds hotels near a specified location using a text search.',
      inputSchema: findNearbyHotelsToolSchema,
      outputSchema: z.array(hotelResultSchema),
    },
    async (input) => {
      const request: TextSearchRequest = {
        params: {
          query: input.query,
          type: 'lodging',
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      };
  
      try {
        const response = await mapsClient.textSearch(request);
        const hotels = response.data.results.slice(0, 6).map((place: Place) => {
          let imageUrl = null;
          if (place.photos && place.photos.length > 0) {
            const photoReference = place.photos[0].photo_reference;
            imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${process.env.GOOGLE_MAPS_API_KEY!}`;
          }
          return {
            name: place.name || 'Unknown Hotel',
            address: place.formatted_address || 'Address not available',
            imageUrl,
          };
        });
        return hotels;
      } catch (error) {
        console.error(`Google Maps Text Search error for query "${input.query}":`, error);
        throw new Error(`Failed to find nearby hotels for: "${input.query}"`);
      }
    }
  );
