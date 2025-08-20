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
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  generateGroundedResponse,
} from "@/ai/flows/generate-grounded-response";
import {
  searchYoutubeVideos,
} from "@/ai/flows/search-youtube-videos";
import type { GenerateGroundedResponseOutput } from "@/ai/schemas/grounded-response-schema";
import type { SearchYoutubeVideosOutput } from "@/ai/schemas/youtube-videos-schema";
import { ResultsDisplay } from "@/components/results-display";
import { ItineraryDisplay } from "@/components/itinerary-display";
import { LoadingState } from "@/components/loading-state";
import { Search, Youtube } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoResultDisplay } from "@/components/video-result-display";

const groundedSearchSchema = z.object({
  query: z.string().min(2, {
    message: "Query must be at least 2 characters.",
  }),
});

const videoSearchSchema = z.object({
  destination: z.string().min(2, {
    message: "Destination must be at least 2 characters.",
  }),
  travelType: z.string().min(2, {
    message: "Travel style must be at least 2 characters.",
  }),
});

export default function Home() {
  const [groundedResponse, setGroundedResponse] =
    useState<GenerateGroundedResponseOutput | null>(null);
  const [videoResponse, setVideoResponse] =
    useState<SearchYoutubeVideosOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setGroundedResponse(null);
    setVideoResponse(null);
    setIsLoading(false);
    groundedSearchForm.reset();
    videoSearchForm.reset();
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
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
              Video Search
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search">
            <Card className="w-full shadow-lg">
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
            <Card className="w-full shadow-lg">
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground mb-4">
                  Find inspiring travel videos from YouTube based on your interests.
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
                          <FormControl>
                            <Input
                              placeholder="Travel Style (e.g., 'Foodie')"
                              {...field}
                              className="text-base"
                            />
                          </FormControl>
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

        <div className="w-full min-h-[20rem]">
          {isLoading ? (
            <LoadingState />
          ) : activeTab === "search" ? (
            groundedResponse ? (
              <ResultsDisplay data={groundedResponse} />
            ) : (
              <Card className="text-center p-12 border-dashed flex items-center justify-center h-full">
                <h2 className="text-xl font-medium text-muted-foreground">
                  Let's plan your next adventure!
                </h2>
              </Card>
            )
          ) : activeTab === "video" ? (
            videoResponse ? (
              <VideoResultDisplay data={videoResponse} />
            ) : (
              <Card className="text-center p-12 border-dashed flex items-center justify-center h-full">
                <h2 className="text-xl font-medium text-muted-foreground">
                  Enter a destination and travel style to find videos.
                </h2>
              </Card>
            )
          ) : null}
        </div>
      </div>
    </main>
  );
}
