'use server';
/**
 * @fileOverview A flow that geocodes a list of addresses using a Gemini tool.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { geocodeTool } from '@/services/google-maps';

const GeocodeAddressInputSchema = z.object({
  addresses: z.array(z.string()).describe('A list of street addresses to geocode.'),
});
export type GeocodeAddressInput = z.infer<typeof GeocodeAddressInputSchema>;

const LocationResultSchema = z.object({
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
});

const GeocodeAddressOutputSchema = z.object({
  locations: z.array(LocationResultSchema),
});
export type GeocodeAddressOutput = z.infer<typeof GeocodeAddressOutputSchema>;

export async function geocodeAddress(input: GeocodeAddressInput): Promise<GeocodeAddressOutput> {
  return geocodeAddressFlow(input);
}

const geocodeAddressFlow = ai.defineFlow(
  {
    name: 'geocodeAddressFlow',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async (input) => {
    const geocodedLocations = await Promise.all(
      input.addresses.map(async (address) => {
        try {
          const { latitude, longitude } = await geocodeTool({ address });
          return { address, latitude, longitude };
        } catch (error) {
          console.error(`Failed to geocode address: "${address}"`, error);
          // Return null for failed attempts so we can filter them out.
          return null;
        }
      })
    );

    // Filter out any addresses that failed to geocode.
    const validLocations = geocodedLocations.filter(
      (location): location is z.infer<typeof LocationResultSchema> => location !== null
    );

    if (validLocations.length === 0) {
      throw new Error('Failed to geocode any of the provided addresses.');
    }

    return { locations: validLocations };
  }
);
