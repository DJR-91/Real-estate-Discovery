import * as React from "react";
import type { GenerateGroundedResponseOutput } from "@/ai/schemas/grounded-response-schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Link, Search, BookMarked, Star, MapPin } from "lucide-react";

interface ResultsDisplayProps {
  data: GenerateGroundedResponseOutput;
}

function parseMapsText(text: string) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const details: { [key: string]: string } = {};

  lines.forEach(line => {
      const parts = line.split(/:\s(.*)/s);
      if (parts.length > 1) {
          let key = parts[0].replace('*', '').trim();
          let value = parts[1].trim();

          // Standardize common keys
          if (key.toLowerCase().includes('address')) key = 'Address';
          if (key.toLowerCase().includes('phone')) key = 'Phone Number';
          
          details[key] = value;
      }
  });

  return details;
}

export function ResultsDisplay({ data }: ResultsDisplayProps) {
  const { response, groundingSupports, groundingChunks, webSearchQueries } =
    data;

  // Ensure supports are sorted to process the response string in order
  const sortedSupports = [...(groundingSupports || [])].sort(
    (a, b) => a.segment.startIndex - b.segment.startIndex
  );

  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  // Build the response string with tooltips for citations
  sortedSupports.forEach((support, i) => {
    if (support.segment.startIndex > lastIndex) {
      segments.push(response.substring(lastIndex, support.segment.startIndex));
    }

    const chunkIndices = support.groundingChunkIndices;
    const sources = chunkIndices
      .map((index) => groundingChunks?.[index])
      .filter(Boolean);

    segments.push(
      <TooltipProvider key={i} delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="bg-primary/10 text-primary p-1 rounded-md font-medium cursor-pointer transition-colors hover:bg-primary/20">
              {support.segment.text}
              <sup className="text-accent font-bold text-xs ml-1">
                {chunkIndices.map((i) => i + 1).join(",")}
              </sup>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs" side="top">
            <p className="font-bold mb-2">Cited Sources:</p>
            <ul className="space-y-2">
              {sources.map((source, idx) => {
                 const title = 'web' in source! ? source.web.title : source.maps.title;
                 const uri = 'web' in source! ? source.web.uri : source.maps.uri;
                 return (
                    <li key={idx} className="flex items-start gap-2">
                      <BookMarked className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <a
                        href={uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline truncate"
                        title={title}
                      >
                        {title}
                      </a>
                    </li>
                 )
              })}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    lastIndex = support.segment.endIndex;
  });

  if (lastIndex < response.length) {
    segments.push(response.substring(lastIndex));
  }

  const webChunks = groundingChunks?.filter(c => 'web' in c) || [];
  const mapChunks = groundingChunks?.filter(c => 'maps' in c) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">
            Grounded Response
          </CardTitle>
          <CardDescription>
            This answer is grounded by Google Search and Maps. Citations are highlighted
            and linked to sources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {segments.map((segment, index) => (
              <React.Fragment key={index}>{segment}</React.Fragment>
            ))}
          </p>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            {mapChunks.length > 0 && (
                <div>
                  <h2 className="font-headline text-2xl text-primary mb-4">Grounded Maps Results</h2>
                  <div className="space-y-4">
                    {(mapChunks as {maps: {uri: string, title: string, text: string}}[]).map((chunk, index) => {
                        const ratingMatch = chunk.maps.text.match(/Rating: (.*?)\n/);
                        const rating = ratingMatch ? ratingMatch[1] : null;
                        const parsedDetails = parseMapsText(chunk.maps.text);

                        return (
                            <Card key={index} className="shadow-md">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <CardTitle className="text-xl text-primary/90">{chunk.maps.title}</CardTitle>
                                        {rating && (
                                            <Badge variant="secondary" className="flex items-center gap-1.5 whitespace-nowrap text-base">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                {rating}
                                            </Badge>
                                        )}
                                    </div>
                                    {parsedDetails['Address'] && (
                                      <CardDescription className="flex items-center gap-2 pt-1">
                                          <MapPin className="w-4 h-4 text-muted-foreground" />
                                          {parsedDetails['Address']}
                                      </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{parsedDetails['Description'] || 'No description available.'}</p>
                                </CardContent>
                                <CardFooter>
                                     <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold text-sm">
                                        View on Google Maps &rarr;
                                    </a>
                                </CardFooter>
                            </Card>
                        )
                    })}
                  </div>
                </div>
            )}
        </div>

        <div className="space-y-6">
            {webSearchQueries && webSearchQueries.length > 0 && (
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <span>Search Queries</span>
                </CardTitle>
                <CardDescription>
                    The queries Gemini used for grounding.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="flex flex-wrap gap-2">
                    {webSearchQueries.map((query, index) => (
                    <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm py-1 px-3"
                    >
                        {query}
                    </Badge>
                    ))}
                </div>
                </CardContent>
            </Card>
            )}

            {webChunks.length > 0 && (
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Link className="h-5 w-5 text-muted-foreground" />
                    <span>Web Sources</span>
                </CardTitle>
                <CardDescription>
                    Web pages used to generate this response.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <ul className="space-y-3">
                    {(webChunks as {web: {uri: string, title: string}}[]).map((chunk, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 h-6 w-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold mt-px">
                        {index + 1}
                        </span>
                        <a
                        href={chunk.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        title={chunk.web.uri}
                        >
                        {chunk.web.title}
                        </a>
                    </li>
                    ))}
                </ul>
                </CardContent>
            </Card>
            )}
        </div>
      </div>
    </div>
  );
}
