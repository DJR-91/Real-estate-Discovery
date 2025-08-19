import * as React from "react";
import type { GenerateGroundedResponseOutput } from "@/ai/flows/generate-grounded-response";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Link, Search, BookMarked } from "lucide-react";

interface ResultsDisplayProps {
  data: GenerateGroundedResponseOutput;
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
    // Add text before this segment
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
              {sources.map((source, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <BookMarked className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <a
                    href={source?.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline truncate"
                    title={source?.web.title}
                  >
                    {source?.web.title}
                  </a>
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    lastIndex = support.segment.endIndex;
  });

  // Add any remaining text after the last citation
  if (lastIndex < response.length) {
    segments.push(response.substring(lastIndex));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      {/* Main Response Column */}
      <div className="lg:col-span-2">
        <Card className="shadow-lg h-full border-primary/20">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">
              Grounded Response
            </CardTitle>
            <CardDescription>
              This answer is grounded by Google Search. Citations are highlighted
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
      </div>

      {/* Sidebar with Sources and Queries */}
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

        {groundingChunks && groundingChunks.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Link className="h-5 w-5 text-muted-foreground" />
                <span>Sources</span>
              </CardTitle>
              <CardDescription>
                Web pages used to generate this response.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {groundingChunks.map((chunk, index) => (
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
  );
}
