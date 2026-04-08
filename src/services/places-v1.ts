const API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

interface TextSearchResponse {
  places: Array<{
    id: string;
    displayName: { text: string };
    formattedAddress: string;
  }>;
}

interface PlaceDetailsResponse {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
  reviews?: Array<{
    rating: number;
    text: { text: string };
    publishTime: string;
    relativePublishTimeDescription: string;
    authorAttribution: {
      displayName: string;
      photoUri?: string;
    };
  }>;
  rating?: number;
}

/**
 * Find a place's ID using its name and optional address.
 */
export async function findPlaceIdByName(name: string, address?: string): Promise<string | null> {
  const query = address ? `${name}, ${address}` : name;
  const url = 'https://places.googleapis.com/v1/places:searchText';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
      },
      body: JSON.stringify({ textQuery: query }),
    });

    if (!response.ok) {
      throw new Error(`Places TextSearch failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as TextSearchResponse;
    return data.places?.[0]?.id || null;
  } catch (error) {
    console.error('Error in findPlaceIdByName:', error);
    return null;
  }
}

/**
 * Get place details using its ID.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,photos,reviews,rating',
      },
    });

    if (!response.ok) {
      throw new Error(`Places Details failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as PlaceDetailsResponse;
    return data;
  } catch (error) {
    console.error('Error in getPlaceDetails:', error);
    return null;
  }
}

/**
 * Build the URL for a place photo using the photo resource name.
 * Uses the Places v1 media endpoint.
 */
export function getPhotoUrlV1(photoName: string, maxHeightPx: number = 600, maxWidthPx: number = 800): string {
  // photoName is in the format 'places/PLACE_ID/photos/PHOTO_RESOURCE'
  return `https://places.googleapis.com/v1/${photoName}/media?key=${API_KEY}&maxHeightPx=${maxHeightPx}&maxWidthPx=${maxWidthPx}`;
}
