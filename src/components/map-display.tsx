

"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, ForwardedRef } from 'react';
import type { MapData } from '@/app/page';
import { PlaceCard } from './place-card';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useMap3DCameraEvents, Map3DCameraProps } from '@/hooks/use-map-3d-camera-events';
import { useCallbackRef, useDeepCompareEffect } from '@/hooks/utility-hooks';
import '@/hooks/map-3d-types';
import type { GenerateItineraryOutput } from '@/ai/schemas/itinerary-schema';
import { RoutesApi } from '@/services/routes-api';
import { LiveCameraView } from './live-camera-view';
import { Separator } from './ui/separator';

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
  const maps3dLib = useMapsLibrary('maps3d');
  const markerLib = useMapsLibrary('marker');
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const polylineRef = useRef<google.maps.maps3d.Polyline3DElement | null>(null);

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

  const getIconForLocation = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("restaurant") || lowerName.includes("cafe") || lowerName.includes("food")) return "🍴";
    if (lowerName.includes("hotel") || lowerName.includes("inn") || lowerName.includes("lodging")) return "🏨";
    if (lowerName.includes("park") || lowerName.includes("museum") || lowerName.includes("temple") || lowerName.includes("shrine") || lowerName.includes("tower") || lowerName.includes("market")) return "🏛️";
    return "📍";
  };

  useEffect(() => {
    if (!mapRef.current || !markerLib || !maps3dLib || !itinerary) {
      return;
    }
    const map = mapRef.current as unknown as google.maps.Map;

    // Clear existing elements
    markers.forEach(marker => marker.map = null);
    if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
    }
    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    const processItinerary = async () => {
        const locations = itinerary.flatMap(day => day.locations);
        const geocodedLocations: google.maps.LatLngLiteral[] = [];

        for (const location of locations) {
          if (location.address && location.address !== "Address not available") {
            const position = await geocodeAddress(location.address);
            if (position) {
                geocodedLocations.push(position);

                const icon = getIconForLocation(location.name);

                // Create a custom HTML element for the marker
                const markerElement = document.createElement('div');
                markerElement.style.padding = '4px 8px';
                markerElement.style.background = 'white';
                markerElement.style.borderRadius = '9999px';
                markerElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                markerElement.style.fontSize = '1.5rem'; // 24px
                markerElement.style.display = 'flex';
                markerElement.style.alignItems = 'center';
                markerElement.style.justifyContent = 'center';
                markerElement.textContent = icon;
                
                const marker = new markerLib.AdvancedMarkerElement({
                    map: map,
                    position: position,
                    title: location.name,
                    content: markerElement,
                });
                newMarkers.push(marker);
            }
          }
        }
        setMarkers(newMarkers);

        if(geocodedLocations.length > 1) {
            const apiClient = new RoutesApi(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!);
            const origin = geocodedLocations[0];
            const destination = geocodedLocations[geocodedLocations.length - 1];
            const waypoints = geocodedLocations.slice(1, -1);

            try {
                const res = await apiClient.computeRoutes(origin, destination, waypoints);
                const [route] = res.routes;
                const { geoJsonLinestring } = route.polyline ?? {};
                
                if(geoJsonLinestring && mapRef.current) {
                    const coordinates = geoJsonLinestring.coordinates.map(([lng, lat]) => ({
                        lat,
                        lng,
                        altitude: 2
                      }));
              
                      const polyline3d = new maps3dLib.Polyline3DElement({
                        altitudeMode: maps3dLib.AltitudeMode.RELATIVE_TO_GROUND,
                        coordinates,
                        strokeColor: '#009688', // Accent color
                        strokeWidth: 6
                      });
                      
                      mapRef.current.append(polyline3d);
                      polylineRef.current = polyline3d;
                }

            } catch (e) {
                console.error("Failed to compute routes:", e);
            }
        }
    }
    
    processItinerary();

    // Cleanup function to remove markers when component unmounts or itinerary changes
    return () => {
        newMarkers.forEach(marker => marker.map = null);
        if (polylineRef.current) {
            polylineRef.current.remove();
        }
    };

  }, [itinerary, markerLib, maps3dLib]);

  if (!data?.location) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg shadow-lg relative">
      <div className="p-6">
        <h2 className="text-3xl font-bold font-headline text-primary">
          Photorealistic 3D Map
        </h2>
        <p className="mt-1 text-muted-foreground">
          Displaying: <b>{data.location.name}</b>
        </p>
      </div>
      <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
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
      <Separator />
      <div className="p-6">
        <h3 className="text-xl font-headline text-primary mb-4">Live Interaction</h3>
        <LiveCameraView />
      </div>
    </div>
  );
}
