import type { SearchYoutubeVideosOutput } from "@/ai/schemas/youtube-videos-schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Button } from "./ui/button";
import { Route } from "lucide-react";

interface VideoResultDisplayProps {
  data: SearchYoutubeVideosOutput;
  onGenerateItinerary: (video: { id: string; title: string }) => void;
}

export function VideoResultDisplay({ data, onGenerateItinerary }: VideoResultDisplayProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-headline text-primary">Video Results</h2>
        <p className="text-sm text-muted-foreground">Select a video to generate an itinerary</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.videos.map((video) => (
          <Card key={video.id} className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors">
            <div>
              <CardHeader className="p-0">
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                  <div className="relative aspect-video">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      className="rounded-t-lg object-cover"
                    />
                  </div>
                </a>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg leading-tight line-clamp-2">{video.title}</CardTitle>
              </CardContent>
            </div>
            <CardFooter className="p-4 pt-0">
              <Button onClick={() => onGenerateItinerary({id: video.id, title: video.title})} className="w-full">
                <Route className="mr-2 h-4 w-4" />
                Generate Itinerary
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
