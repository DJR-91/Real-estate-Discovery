
import type { PointOfInterest } from '@/ai/schemas/grounded-response-schema';
import Image from 'next/image';
import { PlaceRating } from './place-rating';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface PlaceCardProps {
  place: PointOfInterest;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const { name, description, imageUrl, rating, userRatingCount } = place;

  return (
    <Card className="h-full flex flex-col">
      {imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={`Photo of ${name}`}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 768px) 100vw, 33vw"
            data-ai-hint="tourist location"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="font-headline text-xl">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <PlaceRating rating={rating} userRatingCount={userRatingCount} />
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
