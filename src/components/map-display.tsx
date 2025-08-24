
"use client";

import React, { useEffect, useRef } from 'react';
import type { MapData } from '@/app/page';
import { PlaceCard } from './place-card';

// Define a more specific TypeScript type for the 3D Map HTML Element
interface Map3DElement extends HTMLElement {
  center: { lat: number; lng: number; altitude: number; };
  defaultUIDisabled: boolean;
  tilt: number;
  heading: number;
  range: number; // Used to control camera distance
  mode: string;
  flyCameraAround: (options: { camera: { center: { lat: number; lng: number; altitude: number; }; tilt: number; range: number; heading: number; }; durationMillis: number; rounds: number; }) => void;
}

// Update the global JSX namespace to make TypeScript recognize the custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-map-3d': React.DetailedHTMLProps<React.HTMLAttributes<Map3DElement>, Map3DElement>;
    }
  }
}

export default function MapDisplay({ data }: { data: MapData }) {
  const mapRef = useRef<Map3DElement>(null);

  useEffect(() => {
    // Exit if the map element isn't ready or if there's no location data
    if (!mapRef.current || !data?.location) return;

    const map = mapRef.current;
    const { lat, lng } = data.location;

    // Set the map's initial properties directly
    map.center = { lat, lng, altitude: 0 };
    map.range = 1000; // Sets the camera's distance from the center in meters
    map.tilt = 75;    // Sets the camera's viewing angle
    map.heading = 330;  // Sets the camera's compass direction
    map.defaultUIDisabled = true; // Hides the default map controls
    map.mode = "SATELLITE";


    map.flyCameraAround({
      camera: {
          center: { lat, lng, altitude: 0 },
          tilt: 75,
          range: 1000,
          heading: 330,
      },
      durationMillis: 250000,
      rounds: 5
  });

  
  }, [data]); // Rerun this effect if the `data` prop changes

  if (!data?.location) {
    return null; // Don't render anything if there's no location data
  }

  // Render the component's JSX
  return (
    <div className="bg-white rounded-lg shadow-lg text-gray-800">
      <div className="p-6">
        <h2 className="text-3xl font-bold font-headline text-primary">
          Photorealistic 3D Map
        </h2>
        <p className="mt-1 text-muted-foreground">
          Displaying: <b>{data.location.name}</b>
        </p>
      </div>
      <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <gmp-map-3d 
              map-id="21b670ae378cc0c7ef920de7" 
              ref={mapRef} 
              style={{ height: '500px', width: '100%', borderRadius: '0.5rem', background: '#e2e8f0' }}
            ></gmp-map-3d>
        </div>
        <div className="md:col-span-1">
            {data.place && <PlaceCard place={data.place} />}
        </div>
      </div>
    </div>
  );
}
