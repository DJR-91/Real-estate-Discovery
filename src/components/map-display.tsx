
"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, ForwardedRef } from 'react';
import type { MapData } from '@/app/page';
import { PlaceCard } from './place-card';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useMap3DCameraEvents, Map3DCameraProps } from '@/hooks/use-map-3d-camera-events';
import { useCallbackRef, useDeepCompareEffect } from '@/hooks/utility-hooks';
import '@/hooks/map-3d-types';
import type { ItineraryDaySchema } from '@/ai/schemas/itinerary-schema';
import type { GenerateItineraryOutput } from '@/ai/schemas/itinerary-schema';

// The new reusable Map3D component logic, adapted from your provided code
export type { Map3DCameraProps };

const Map3D = forwardRef(
  (
    props: Map3DProps,
    forwardedRef: ForwardedRef<google.maps.maps3d.Map3DElement | null>
  ) => {
    useMapsLibrary('maps3d');

    const [map3DElement, map3dRef] =
      useCallbackRef<google.maps.maps3d.Map3DElement>();

    useMap3DCameraEvents(map3DElement, p => {
      if (!props.onCameraChange) return;
      props.onCameraChange(p);
    });

    const [customElementsReady, setCustomElementsReady] = useState(false);
    useEffect(() => {
      customElements.whenDefined('gmp-map-3d').then(() => {
        setCustomElementsReady(true);
      });
    }, []);

    const {center, heading, tilt, range, roll, ...map3dOptions} = props;

    useDeepCompareEffect(() => {
      if (!map3DElement) return;
      Object.assign(map3DElement, map3dOptions);
    }, [map3DElement, map3dOptions]);

    useImperativeHandle<
      google.maps.maps3d.Map3DElement | null,
      google.maps.maps3d.Map3DElement | null
    >(forwardedRef, () => map3DElement, [map3DElement]);

    if (!customElementsReady) return null;

    return (
      <gmp-map-3d
        ref={map3dRef}
        center={center}
        range={range}
        heading={heading}
        tilt={tilt}
        roll={roll}
        mode="SATELLITE"
        {...map3dOptions}
        ></gmp-map-3d>
    );
  }
);
Map3D.displayName = "Map3D";


// The main MapDisplay component that uses the new Map3D component
export default function MapDisplay({ data, itinerary }: { data: MapData, itinerary: GenerateItineraryOutput['itinerary'] | null | undefined }) {
  const mapRef = useRef<google.maps.maps3d.Map3DElement>(null);
  const markerLib = useMapsLibrary('marker');
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);

  useEffect(() => {
    if (!mapRef.current || !data?.location) return;

    const map = mapRef.current;
    const { lat, lng } = data.location;
    
    // Used for both the fly to function and the location to fly around.
    const flyToCamera = {
        center: { lat, lng, altitude: 80 },
        range: 1500,
        tilt: 77,
        heading: -45,
    };
  
    // Fly the camera from its current position to the new location.
    map.flyCameraTo({
        endCamera: flyToCamera,
        durationMillis: 3000, // Flight duration in milliseconds
    });
    
    // When the flight animation has completed, start orbiting the location.
    const handleAnimationEnd = () => {
        map.flyCameraAround({
            camera: flyToCamera, // Location to fly around
            durationMillis: 25000, // Time for one full orbit
            rounds: 1, // Number of rotations
        });
    };
    
    // Add a one-time event listener for the animation end.
    map.addEventListener('gmp-animationend', handleAnimationEnd, { once: true });
    
    // Cleanup function to remove the listener if the component unmounts or data changes mid-animation.
    return () => {
      map.removeEventListener('gmp-animationend', handleAnimationEnd);
    };

  }, [data]);
  
  const geocodeAddress = (address: string): Promise<google.maps.LatLngLiteral | null> => {
    return new Promise((resolve) => {
        if (!window.google || !window.google.maps) {
            resolve(null);
            return;
        }
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results && results[0]) {
                const location = results[0].geometry.location;
                resolve({ lat: location.lat(), lng: location.lng() });
            } else {
                console.warn(`Geocoding failed for ${address}: ${status}`);
                resolve(null);
            }
        });
    });
  };

  useEffect(() => {
    if (!mapRef.current || !markerLib || !itinerary) {
      return;
    }
    const map = mapRef.current;

    // Clear existing markers
    markers.forEach(marker => marker.map = null);
    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    const processMarkers = async () => {
        for (const day of itinerary) {
            for (const location of day.locations) {
              if (location.address && location.address !== "Address not available") {
                const position = await geocodeAddress(location.address);
                if (position) {
                    const marker = new markerLib.AdvancedMarkerElement({
                        map: map as unknown as google.maps.Map, // Cast since Map3D is not directly a Map
                        position: position,
                        title: location.name,
                    });
                    newMarkers.push(marker);
                }
              }
            }
        }
        setMarkers(newMarkers);
    }
    
    processMarkers();

    // Cleanup function to remove markers when component unmounts or itinerary changes
    return () => {
        newMarkers.forEach(marker => marker.map = null);
    };

  }, [itinerary, markerLib]);

  if (!data?.location) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg shadow-lg">
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
            <Map3D
              ref={mapRef}
              map-id="21b670ae378cc0c7ef920de7"
              style={{ height: '500px', width: '100%', borderRadius: '0.5rem' }}
              defaultUIDisabled={true}
            />
        </div>
        <div className="md:col-span-1">
            {data.place && <PlaceCard place={data.place} />}
        </div>
      </div>
    </div>
  );
}
