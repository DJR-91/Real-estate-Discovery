
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  generateGroundedResponse,
} from "@/ai/flows/generate-grounded-response";
import {
  searchYoutubeVideos,
} from "@/ai/flows/search-youtube-videos";
import { generateItinerary } from "@/ai/flows/generate-itinerary";
import { generateItineraryBanner } from "@/ai/flows/generate-itinerary-banner";
import type { GenerateGroundedResponseOutput } from "@/ai/schemas/grounded-response-schema";
import type { SearchYoutubeVideosOutput } from "@/ai/schemas/youtube-videos-schema";
import type { GenerateItineraryOutput } from "@/ai/schemas/itinerary-schema";
import type { GenerateItineraryInput } from "@/ai/schemas/itinerary-schema";
import { ResultsDisplay } from "@/components/results-display";
import { LoadingState } from "@/components/loading-state";
import { Search, Youtube } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoResultDisplay } from "@/components/video-result-display";
import { ItineraryDisplay } from "@/components/itinerary-display";
import MapDisplay from "@/components/map-display";
import type { Video } from "@/lib/types";
import { findHotels } from "@/ai/flows/find-hotels";
import type { FindHotelsOutput } from "@/ai/schemas/hotel-schema";
import { HotelDisplay } from "@/components/hotel-display";
import { findTrendyEvents } from "@/ai/flows/find-trendy-events";
import type { FindTrendyEventsOutput } from "@/ai/schemas/event-schema";
import { EventsDisplay } from "@/components/events-display";


const groundedSearchSchema = z.object({
  query: z.string().min(2, {
    message: "Query must be at least 2 characters.",
  }),
});

const videoSearchSchema = z.object({
  destination: z.string().min(2, {
    message: "Destination must be at least 2 characters.",
  }),
  travelType: z.string().min(1, {
    message: "Please select a travel style.",
  }),
});

export interface ItineraryData {
  video: Video;
  itinerary: GenerateItineraryOutput['itinerary'];
  videoSummary: string;
  destination: string;
  bannerUrl?: string;
  isBannerLoading: boolean;
}

export type MapData = {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
};

const travelStyles = [
  "Foodie",
  "Adventure Seeker",
  "Relaxation",
  "Cultural",
  "Budget",
  "Luxury",
  "Family Friendly",
  "Backpacking",
];

export default function Home() {
  const [groundedResponse, setGroundedResponse] =
    useState<GenerateGroundedResponseOutput | null>(null);
  const [videoResponse, setVideoResponse] =
    useState<SearchYoutubeVideosOutput | null>(null);
  const [itineraryResponse, setItineraryResponse] = 
    useState<ItineraryData | null>(null);
  const [hotelResponse, setHotelResponse] = useState<FindHotelsOutput | null>(null);
  const [eventsResponse, setEventsResponse] = useState<FindTrendyEventsOutput | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isItineraryLoading, setIsItineraryLoading] = useState(false);
  const [isHotelLoading, setIsHotelLoading] = useState(false);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const { toast } = useToast();

  const groundedSearchForm = useForm<z.infer<typeof groundedSearchSchema>>({
    resolver: zodResolver(groundedSearchSchema),
    defaultValues: {
      query: "",
    },
  });

  const videoSearchForm = useForm<z.infer<typeof videoSearchSchema>>({
    resolver: zodResolver(videoSearchSchema),
    defaultValues: {
      destination: "",
      travelType: "",
    },
  });

  async function onGroundedSearchSubmit(
    values: z.infer<typeof groundedSearchSchema>
  ) {
    setIsLoading(true);
    setGroundedResponse(null);
    setVideoResponse(null);
    setItineraryResponse(null);
    setHotelResponse(null);
    setEventsResponse(null);
    setMapData(null);
    try {
      const result = await generateGroundedResponse({ query: values.query });
      setGroundedResponse(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get a response from Gemini. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onVideoSearchSubmit(values: z.infer<typeof videoSearchSchema>) {
    setIsLoading(true);
    setGroundedResponse(null);
    setVideoResponse(null);
    setItineraryResponse(null);
    setHotelResponse(null);
    setEventsResponse(null);
    setMapData(null);
    try {
      const result = await searchYoutubeVideos({
        destination: values.destination,
        travelType: values.travelType,
      });
      setVideoResponse(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description:
          "Failed to find videos. Please check your query and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const geocodeAddress = (address: string): Promise<google.maps.LatLngLiteral> => {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.maps) {
            return reject(new Error("Google Maps API not loaded."));
        }
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results && results[0]) {
                const location = results[0].geometry.location;
                resolve({ lat: location.lat(), lng: location.lng() });
            } else {
                reject(new Error(`Geocode was not successful for the following reason: ${status}`));
            }
        });
    });
  };

  const handleGenerateItinerary = async (video: Video) => {
    const videoSearchValues = videoSearchForm.getValues();
    if (!videoSearchValues.destination || !videoSearchValues.travelType) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a destination and travel style before generating an itinerary.",
      });
      return;
    }
    
    setIsItineraryLoading(true);
    setItineraryResponse(null);
    setHotelResponse(null);
    setEventsResponse(null);
    setMapData(null);

    const itineraryInput: GenerateItineraryInput = {
      videoId: video.id,
      videoTitle: video.title,
      destination: videoSearchValues.destination,
      travelType: videoSearchValues.travelType,
    };
    
    const bannerInput = {
        videoTitle: video.title,
        videoDescription: video.description,
        destination: videoSearchValues.destination,
    }

    try {
      // Generate itinerary first
      const itineraryResult = await generateItinerary(itineraryInput);
      
      // Show itinerary immediately, with a loading state for the banner
      setItineraryResponse({
        video: video,
        itinerary: itineraryResult.itinerary,
        videoSummary: itineraryResult.videoSummary,
        destination: videoSearchValues.destination,
        isBannerLoading: true,
      });

      // Show map for the first location
      const firstLocation = itineraryResult.itinerary[0]?.locations[0];
      if (firstLocation?.address) {
        try {
            const coords = await geocodeAddress(firstLocation.address);
            setMapData({
                location: {
                    name: firstLocation.name,
                    lat: coords.lat,
                    lng: coords.lng,
                }
            });
        } catch (e) {
            console.error("Client-side geocoding failed", e);
            toast({
              variant: "destructive",
              title: "Map Error",
              description: "Could not find coordinates for the first location.",
            });
        }
      }
      setIsItineraryLoading(false);

      // Now, generate the banner in the background
      const bannerResult = await generateItineraryBanner(bannerInput);
      
      // Update the state with the banner URL when it's ready
      setItineraryResponse(prev => prev ? ({ ...prev, bannerUrl: bannerResult.bannerUrl, isBannerLoading: false }) : null);

    } catch (error) {
      console.error(error);
      setIsItineraryLoading(false); // Make sure loading stops on error
      setItineraryResponse(null); // Clear any partial state
      toast({
        variant: "destructive",
        title: "Itinerary Generation Failed",
        description: "We couldn't create an itinerary from this video. It might not contain enough location information.",
      });
    }
  };

  const handleFindHotels = async (destination: string) => {
    setIsHotelLoading(true);
    setHotelResponse(null);
    try {
      const result = await findHotels({ destination });
      setHotelResponse(result);
    } catch (error) {
      console.error("Failed to find hotels:", error);
      toast({
        variant: "destructive",
        title: "Hotel Search Failed",
        description: "We couldn't find hotels for this destination. Please try again later.",
      });
    } finally {
      setIsHotelLoading(false);
    }
  };

  const handleFindEvents = async (destination: string, videoSummary: string) => {
    setIsEventsLoading(true);
    setEventsResponse(null);
    try {
      const result = await findTrendyEvents({ destination, videoSummary });
      setEventsResponse(result);
    } catch (error) {
      console.error("Failed to find events:", error);
      toast({
        variant: "destructive",
        title: "Event Search Failed",
        description: "We couldn't find any trendy events for this destination. Please try again later.",
      });
    } finally {
      setIsEventsLoading(false);
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setGroundedResponse(null);
    setVideoResponse(null);
    setItineraryResponse(null);
    setHotelResponse(null);
    setEventsResponse(null);
    setMapData(null);
    setIsLoading(false);
    setIsItineraryLoading(false);
    setIsHotelLoading(false);
    setIsEventsLoading(false);
    groundedSearchForm.reset();
    videoSearchForm.reset();
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-6xl space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Find Your Next Travel Experience
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Use AI to discover destinations or find travel inspiration from YouTube.
          </p>
        </header>

        <Tabs
          defaultValue="search"
          className="w-full"
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" />
              Grounded Search
            </TabsTrigger>
            <TabsTrigger value="video">
              <Youtube className="mr-2 h-4 w-4" />
              Video & Itinerary Search
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search">
            <Card className="w-full shadow-lg max-w-4xl mx-auto">
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground mb-4">
                  Tell us what you're looking for, and we'll suggest
                  destinations, activities, and itineraries grounded in
                  real-time information.
                </p>
                <Form {...groundedSearchForm}>
                  <form
                    onSubmit={groundedSearchForm.handleSubmit(
                      onGroundedSearchSubmit
                    )}
                    className="flex items-start gap-4"
                  >
                    <FormField
                      control={groundedSearchForm.control}
                      name="query"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input
                              placeholder="e.g., 'family-friendly beach vacation in Southeast Asia'"
                              {...field}
                              className="text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading} size="lg">
                      <Search className="mr-2 h-5 w-5" />
                      Search
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="video">
            <Card className="w-full shadow-lg max-w-4xl mx-auto">
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground mb-4">
                  Find inspiring travel videos, then generate a 3-day itinerary.
                </p>
                <Form {...videoSearchForm}>
                  <form
                    onSubmit={videoSearchForm.handleSubmit(onVideoSearchSubmit)}
                    className="flex flex-col sm:flex-row items-start gap-4"
                  >
                    <FormField
                      control={videoSearchForm.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem className="flex-grow w-full">
                          <FormControl>
                            <Input
                              placeholder="Destination (e.g., 'Tokyo')"
                              {...field}
                              className="text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={videoSearchForm.control}
                      name="travelType"
                      render={({ field }) => (
                        <FormItem className="flex-grow w-full">
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="text-base">
                                <SelectValue placeholder="Select a travel style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {travelStyles.map((style) => (
                                <SelectItem key={style} value={style}>
                                  {style}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
                      <Youtube className="mr-2 h-5 w-5" />
                      Search Videos
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="w-full min-h-[20rem] space-y-8">
          {isLoading || isItineraryLoading ? (
            <LoadingState />
          ) : activeTab === "search" ? (
            groundedResponse ? (
              <ResultsDisplay data={groundedResponse} />
            ) : (
              <Card className="text-center p-12 border-dashed flex items-center justify-center h-full max-w-4xl mx-auto">
                <h2 className="text-xl font-medium text-muted-foreground">
                  Let's plan your next adventure!
                </h2>
              </Card>
            )
          ) : activeTab === "video" ? (
            itineraryResponse ? (
              <ItineraryDisplay 
                data={itineraryResponse} 
                onFindHotels={handleFindHotels}
                isHotelLoading={isHotelLoading}
                onFindEvents={handleFindEvents}
                isEventsLoading={isEventsLoading}
              />
            ) : videoResponse ? (
              <VideoResultDisplay data={videoResponse} onGenerateItinerary={handleGenerateItinerary} />
            ) : (
              <Card className="text-center p-12 border-dashed flex items-center justify-center h-full max-w-4xl mx-auto">
                <h2 className="text-xl font-medium text-muted-foreground">
                  Enter a destination and travel style to find videos.
                </h2>
              </Card>
            )
          ) : null}
          
          {mapData && !isItineraryLoading && (
            <div className="pt-8">
              <MapDisplay data={mapData} />
            </div>
          )}

          {isHotelLoading ? <LoadingState /> : hotelResponse ? <HotelDisplay data={hotelResponse} /> : null }

          {isEventsLoading ? <LoadingState /> : eventsResponse ? <EventsDisplay data={eventsResponse} /> : null}

        </div>
      </div>
    </main>
  );
}

    