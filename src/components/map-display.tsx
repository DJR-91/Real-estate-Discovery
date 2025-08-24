
"use client";

import React, { useEffect, useRef } from 'react';
import type { MapData } from '@/app/page';
import { PlaceCard } from './place-card';
import { DOMAttributes, RefAttributes } from 'react';

// add an overload signature for the useMapsLibrary hook, so typescript
// knows what the 'maps3d' library is.
declare module '@vis.gl/react-google-maps' {
  export function useMapsLibrary(
    name: 'maps3d'
  ): typeof google.maps.maps3d | null;
}

// temporary fix until @types/google.maps is updated with the latest changes
declare global {
  namespace google.maps.maps3d {
    interface CameraOptions {
      center?: google.maps.LatLngAltitude | google.maps.LatLngAltitudeLiteral;
      heading?: number;
      range?: number;
      roll?: number;
      tilt?: number;
    }

    interface FlyAroundAnimationOptions {
      camera: CameraOptions;
      durationMillis?: number;
      rounds?: number;
    }

    interface FlyToAnimationOptions {
      endCamera: CameraOptions;
      durationMillis?: number;
    }
    interface Map3DElement extends HTMLElement {
      mode?: 'HYBRID' | 'SATELLITE';
      flyCameraAround: (options: FlyAroundAnimationOptions) => void;
      flyCameraTo: (options: FlyToAnimationOptions) => void;
    }
  }
}

// add the <gmp-map-3d> custom-element to the JSX.IntrinsicElements
// interface, so it can be used in jsx
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ['gmp-map-3d']: CustomElement<
        google.maps.maps3d.Map3DElement,
        google.maps.maps3d.Map3DElement
      >;
    }
  }
}

// a helper type for CustomElement definitions
type CustomElement<TElem, TAttr> = Partial<
  TAttr &
    DOMAttributes<TElem> &
    RefAttributes<TElem> & {
      // for whatever reason, anything else doesn't work as children
      // of a custom element, so we allow `any` here
      children: any;
    }
>;

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

export default function MapDisplay({ data }: { data: MapData }) {
  const mapRef = useRef<Map3DElement>(null);

  useEffect(() => {
    // Exit if the map element isn't ready or if there's no location data
    if (!mapRef.current || !data?.location) return;

    const map = mapRef.current;
    const { lat, lng } = data.location;
    
    // Define the camera position and animation details
    const flyToCamera = {
        center: { lat, lng, altitude: 80 },
        range: 1500,
        tilt: 77,
        heading: -45,
    };
  
    // Animate the camera to the new location
    map.flyCameraTo({
        endCamera: flyToCamera,
        durationMillis: 3000,
    });
    
    // After the initial flight, start circling the location
    const handleAnimationEnd = () => {
        map.flyCameraAround({
            camera: flyToCamera,
            durationMillis: 25000,
            rounds: 1,
        });
    };
    
    map.addEventListener('gmp-animationend', handleAnimationEnd, { once: true });
    
    // Set other map properties
    map.defaultUIDisabled = true;
    map.mode = "SATELLITE";

    // Cleanup: remove the event listener when the component unmounts or data changes
    return () => {
      // It's good practice to remove event listeners, though 'once: true' handles this for us.
    };

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
