
'use server';

/**
 * @fileOverview A flow that generates a travel itinerary based on a specific YouTube video.
 *
 * This flow takes a YouTube video ID, destination, and travel type,
 * and uses Gemini to create a 3-day itinerary by analyzing the video content directly.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { findPlaceTool } from '@/services/google-maps';
import { GenerateItineraryInputSchema, GenerateItineraryOutputSchema, type GenerateItineraryInput, type GenerateItineraryOutput } from '@/ai/schemas/itinerary-schema';

export async function generateItinerary(
  input: GenerateItineraryInput
): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: GenerateItineraryOutputSchema,
  },
  async (input) => {
    const videoUrl = `https://www.youtube.com/watch?v=${input.videoId}`;
    let summaryOutput;
    let itineraryOutput;

    // Step 1: Summarize the YouTube video and extract places of interest.
    try {
        summaryOutput = (await ai.generate({
            model: 'googleai/gemini-2.5-flash-lite',
            output: {
                schema: z.object({
                    summary: z.string().describe('A concise summary of the YouTube video.'),
                    placesOfInterest: z.array(z.string()).describe('A list of significant places, landmarks, or establishments mentioned or shown in the video.')
                })
            },
            prompt: [
                {text: `Please summarize the following YouTube video titled "${input.videoTitle}".
                Your summary should be concise and engaging.
                Crucially, identify and list all specific places of interest (e.g., landmarks, restaurants, shops, attractions) that are mentioned or clearly visible in the video content.
                `},
                { media: { url: videoUrl, contentType: "video/mp4" } }
            ],
        })).output;

        if (!summaryOutput || !summaryOutput.summary) {
            throw new Error('Summary output was empty.');
        }
    } catch (error) {
        console.error("Error generating video summary:", error);
        throw new Error('Failed to analyze the YouTube video. It might be private or unavailable.');
    }

    const { summary, placesOfInterest } = summaryOutput;

    // Step 2: Use the summary and extracted places to generate a 3-day itinerary.
    try {
        itineraryOutput = (await ai.generate({
            model: 'googleai/gemini-2.5-flash-lite',
            output: {
                schema: z.object({
                    itinerary: z.array(z.object({
                        day: z.number().describe('The day number (1, 2, or 3).'),
                        title: z.string().describe('A creative title for the day\'s theme (e.g., "Cultural Immersion in Shibuya").'),
                        locations: z.array(z.object({
                          name: z.string().describe('The name of the location.'),
                          description: z.string().describe('A brief description of the location and why it is recommended.'),
                        })).describe('A list of locations to visit on this day.'),
                      }))
                })
            },
            prompt: [
                {text: `You are a travel expert tasked with creating a 3-day itinerary for a trip to ${input.destination}.

The user's travel style is "${input.travelType}".

Here is a summary of a relevant YouTube video titled "${input.videoTitle}":
"${summary}"

Places of interest explicitly identified from the video: ${placesOfInterest.join(', ')}.

Based on this summary and the identified places, suggest major landmarks, restaurants, and activities.
Use ONLY the information derived from the video summary and the listed places of interest. Do NOT recommend anything that is not mentioned or clearly implied from the provided video summary.

For each location, provide only its name and a short description. Do NOT include an address or image URL; that will be found later.

Present the output as a 3-day plan. Each day should have a creative title and a list of locations.
`},
            ],
        })).output;

        if (!itineraryOutput || !itineraryOutput.itinerary) {
            throw new Error('Itinerary output was empty.');
        }
    } catch (error) {
        console.error("Error generating itinerary from summary:", error);
        throw new Error('Failed to generate an itinerary from the video content.');
    }

    // Add the two mock locations to the beginning of Day 1
    const mockLocations = [
        {
          name: 'American Museum of Natural History',
          description: 'One of the largest natural history museums in the world, famous for its dinosaur exhibits and the Milstein Hall of Ocean Life.',
        },
        {
          name: 'Tony\'s Di Napoli',
          description: 'A classic family-style Italian restaurant in the heart of the Theater District, known for its huge portions and a lively atmosphere.',
        },
    ];

    if (itineraryOutput.itinerary.length > 0) {
        itineraryOutput.itinerary[0].locations.unshift(...mockLocations);
    } else {
        // If the AI somehow returns an empty itinerary, create Day 1 with the mock locations.
        itineraryOutput.itinerary.push({
            day: 1,
            title: "Exploring New York's Classics",
            locations: mockLocations
        });
    }


    // Step 3: For each location in the generated itinerary, use the Places API to find its address and a photo.
    const itineraryWithDetails = await Promise.all(
      itineraryOutput.itinerary.map(async (day) => {
        const locationsWithDetails = await Promise.all(
          day.locations.map(async (location) => {
            try {
              // Manually provide address for the mock locations to ensure accuracy
              let query;
              if (location.name === 'American Museum of Natural History') {
                  query = 'American Museum of Natural History, 200 Central Park West, New York, NY 10024';
              } else if (location.name === 'Tony\'s Di Napoli') {
                  query = 'Tony\'s Di Napoli, 147 W 43rd St, New York, NY 10036';
              } else {
                  query = `${location.name}, ${input.destination}`;
              }

              const place = await findPlaceTool({ query: query });
              return {
                ...location,
                address: place.address,
                imageUrl: place.imageUrl,
                rating: place.rating,
                userRatingCount: place.userRatingCount,
              };
            } catch (error) {
              console.warn(`Could not find details for "${location.name}", skipping. Error:`, error);
              // Gracefully handle the error by returning the location without extra details.
              return {
                ...location,
                address: "Address not available",
                imageUrl: null,
                rating: null,
                userRatingCount: null,
              };
            }
          })
        );
        return {
          ...day,
          locations: locationsWithDetails,
        };
      })
    );

    return {
      itinerary: itineraryWithDetails,
      videoSummary: summary,
    };
  }
);
