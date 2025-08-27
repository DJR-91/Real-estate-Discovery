
'use server';

/**
 * @fileOverview A flow that finds trendy, upcoming events for a given destination.
 * This flow returns a mock list of events and does not use live search data.
 */

import { ai } from '@/ai/genkit';
import { FindTrendyEventsInputSchema, FindTrendyEventsOutputSchema, type FindTrendyEventsInput, type FindTrendyEventsOutput } from '@/ai/schemas/event-schema';

export async function findTrendyEvents(input: FindTrendyEventsInput): Promise<FindTrendyEventsOutput> {
  return findTrendyEventsFlow(input);
}

const tokyoMockData: FindTrendyEventsOutput = {
    events: [
      { 
          name: 'Tokyo Ramen Festa 2025', 
          description: `The largest outdoor ramen event in Japan, featuring famous shops from across the country.`,
          location: "Komazawa Olympic Park",
          date: "23 October - 3 November 2025",
          time: "10:00am - 8:30pm",
          url: 'https://example.com/ramen-show' 
      },
      { 
          name: 'Ginza Sake & Food Festival', 
          description: 'Taste premium sake paired with gourmet bites from Ginza\'s top restaurants.',
          location: "Ginza Crossing",
          date: "15-16 November 2025",
          time: "11:00am - 7:00pm",
          url: 'https://example.com/sake-fest'
      },
      { 
          name: 'Autumn Truffle Week', 
          description: 'Experience exclusive menus featuring the rare autumn truffle at fine dining establishments.', 
          location: "Various Restaurants in Minato",
          date: "1-9 November 2025",
          time: "Varies by restaurant",
          url: 'https://example.com/truffle-week'
      },
      { 
          name: 'Christmas Market at Hibiya Park', 
          description: 'Enjoy classic German-style Christmas food, hot wine, and festive decorations.',
          location: "Hibiya Park",
          date: "12-25 December 2025",
          time: "4:00pm - 10:00pm",
          url: 'https://example.com/christmas-market'
      },
      { 
          name: 'World Wagyu Expo', 
          description: 'A massive celebration of Japanese beef, with tasting booths and cooking demonstrations.', 
          location: "Tokyo Big Sight",
          date: "5-7 December 2025",
          time: "10:00am - 6:00pm",
          url: 'https://example.com/wagyu-expo' 
      },
      { 
          name: 'Artisanal Mochi Pounding Festival', 
          description: 'Join in the traditional new year preparations and taste freshly made mochi.',
          location: "Asakusa Shrine",
          date: "28 December 2025",
          time: "11:00am - 2:00pm",
          url: 'https://example.com/mochi-fest' 
      },
    ],
    tours: [
      {
        title: "Tokyo: Shinjuku Food Tour (13 Dishes at 4 Local Eateries)",
        location: "Tokyo",
        tags: ["Early booking recommended"],
        description: "This small group tour led by a local guide is a great way to discover hidden local dining spots...",
        duration: "3 hours",
        reviews: { rating: 4.9, rating_text: "Exceptional", count: 400 },
        features: { free_cancellation: true },
        pricing: { currency: "USD", from_price: 90.00 },
        availability: "Available starting Oct 1"
      },
      {
        title: "Shinjuku Hidden Bar hopping 2 hours tour– 2 Stops, 3 Drinks",
        location: "Tokyo",
        tags: ["Early booking recommended"],
        description: "Unlock the magic of Shinjuku’s nightlife in just two unforgettable hours!! Join a local guide and...",
        duration: "2 hours",
        reviews: { rating: 5.0, rating_text: "Exceptional", count: 1 },
        features: { free_cancellation: true },
        pricing: { currency: "USD", from_price: 104.00 },
        availability: "Available starting Oct 1"
      },
      {
        title: "Tokyo Tsukiji Fish Market Food and Culture Walking Tour",
        location: "Tokyo",
        tags: ["Early booking recommended"],
        description: "Let’s explore Tsukiji, the vibrant market for the locals and the professional chefs for more than...",
        duration: "3 hours",
        reviews: { rating: 4.8, rating_text: "Exceptional", count: 344 },
        features: { free_cancellation: true },
        pricing: { currency: "USD", from_price: 104.00 },
        availability: "Available starting Oct 1"
      },
      {
        title: "Tokyo: Tsukiji Fish Market Food and Walking tour",
        location: "Tokyo",
        tags: ["Early booking recommended"],
        description: "Explore the sights and tastes of the Outer Tsukiji Fish Market on a walking tour. Sample a variet...",
        duration: "3 hours",
        reviews: { rating: 4.9, rating_text: "Exceptional", count: 872 },
        features: { free_cancellation: true },
        pricing: { currency: "USD", from_price: 100.00 },
        availability: "Available starting Oct 1"
      }
    ]
};

const newYorkMockData: FindTrendyEventsOutput = {
    events: [
        {
            name: "New York Comic Con",
            description: "East Coast's biggest pop-culture convention with panels, autograph sessions, and exhibitors.",
            location: "Javits Center, Hudson Yards",
            date: "October 9-12, 2025",
            time: "10:00am - 7:00pm",
            url: "https://example.com/nycc"
        },
        {
            name: "Open House New York Weekend",
            description: "A cultural festival where hundreds of normally closed sites open to the public for free tours.",
            location: "Citywide",
            date: "October 18-19, 2025",
            time: "Varies by location",
            url: "https://example.com/ohny"
        },
        {
            name: "Diwali Motorcade",
            description: "A cultural festival with floats, fireworks, and Bollywood beats to celebrate Diwali in 'Little Guyana'.",
            location: "Liberty Avenue, Richmond Hill, Queens",
            date: "October 21, 2025",
            time: "Starts at dusk",
            url: "https://example.com/diwali-motorcade"
        },
        {
            name: "Village Halloween Parade",
            description: "An iconic parade with colorful costumes, live performances, and music.",
            location: "Sixth Avenue, Greenwich Village",
            date: "October 31, 2025",
            time: "7:00pm - 11:00pm",
            url: "https://example.com/halloween-parade"
        },
        {
            name: "Night Skating at Rockefeller Center",
            description: "Enjoy ice skating at the iconic Rockefeller Center rink, which opens for the season in October.",
            location: "Rockefeller Center",
            date: "Opens October 25, 2025",
            time: "Varies",
            url: "https://example.com/rockefeller-skating"
        },
        {
            name: "Hudson River Foliage Cruise",
            description: "A scenic boat cruise on the Hudson River to enjoy the beautiful fall foliage.",
            location: "Hudson River",
            date: "Weekends through October 27, 2025",
            time: "Varies",
            url: "https://example.com/foliage-cruise"
        }
    ],
    tours: [] // No specific tours provided for NYC in the prompt
};


const findTrendyEventsFlow = ai.defineFlow(
  {
    name: 'findTrendyEventsFlow',
    inputSchema: FindTrendyEventsInputSchema,
    outputSchema: FindTrendyEventsOutputSchema,
  },
  async (input) => {
    
    if (input.destination.toLowerCase().includes('new york')) {
        return newYorkMockData;
    }
    
    // Default to Tokyo mock data
    return tokyoMockData;
  }
);
