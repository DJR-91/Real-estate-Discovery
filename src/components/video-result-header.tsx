
interface VideoResultHeaderProps {
  destination: string;
}

export function VideoResultHeader({ destination }: VideoResultHeaderProps) {
  const title = destination === "Places of Interest" 
    ? "Places of Interest"
    : `Video Results for ${destination}`;
    
  const subTitle = destination === "Places of Interest"
    ? "Based on your search query"
    : "Select a video to generate an itinerary";

  return (
    <div className="flex justify-between items-start mb-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-headline text-primary">{title}</h2>
        <p className="text-sm text-muted-foreground">{subTitle}</p>
      </div>
    </div>
  );
}
