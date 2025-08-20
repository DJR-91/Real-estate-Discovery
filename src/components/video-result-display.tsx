import type { SearchYoutubeVideosOutput } from "@/ai/schemas/youtube-videos-schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

interface VideoResultDisplayProps {
  data: SearchYoutubeVideosOutput;
}

export function VideoResultDisplay({ data }: VideoResultDisplayProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-headline text-primary mb-4">Video Results</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.videos.map((video) => (
          <a href={video.url} target="_blank" rel="noopener noreferrer" key={video.id}>
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="rounded-t-lg object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg leading-tight line-clamp-2">{video.title}</CardTitle>
                <CardDescription className="mt-2 text-sm line-clamp-3">
                  {video.description}
                </CardDescription>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
