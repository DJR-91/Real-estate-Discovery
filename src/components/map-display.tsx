

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


// Helper function to compute heading between two LatLng points
const computeHeading = (from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral): number => {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = Math.atan2(y, x);
  return ((brng * 180) / Math.PI + 360) % 360;
};

// The main MapDisplay component that uses the new Map3D component
export default function MapDisplay({ data, itinerary, startTour = false, onTourEnd }: { data: MapData, itinerary: GenerateItineraryOutput['itinerary'] | null | undefined, startTour?: boolean, onTourEnd?: () => void }) {
  const [mapElement, setMapElement] = useState<google.maps.maps3d.Map3DElement | null>(null);
  const maps3dLib = typeof window !== 'undefined' && window.google?.maps?.maps3d ? window.google.maps.maps3d : null;
  const markerLib = typeof window !== 'undefined' && window.google?.maps?.marker ? window.google.maps.marker : null;
  const [markers, setMarkers] = useState<HTMLElement[]>([]);
  const polylineRef = useRef<google.maps.maps3d.Polyline3DElement | null>(null);
  const [waypointCoords, setWaypointCoords] = useState<google.maps.LatLngLiteral[]>([]);
  const [currentTourIndex, setCurrentTourIndex] = useState(-1);
  const [tourLocations, setTourLocations] = useState<Array<{ coords: google.maps.LatLngLiteral; details: any }>>([]);
  
  const [initialFlightDone, setInitialFlightDone] = useState(false);
  
  // Initial load flight effect transparent advance safely Continuous loading safely correctly
  useEffect(() => {
    console.log("MapDisplay Initial Effects. Element:", !!mapElement, "Waypoints:", waypointCoords.length);
    
    if (!mapElement || waypointCoords.length === 0 || startTour || initialFlightDone) return;

    const startPoint = waypointCoords[0];
    console.log("Executing Initial Flight to first Attraction:", startPoint);
    
    const flyToCamera = {
       center: { ...startPoint, altitude: 150 },
       range: 1200,
       tilt: 60,
       heading: 0
    };

    if (typeof mapElement.stopAnimation === 'function') {
       mapElement.stopAnimation();
    }

    mapElement.flyCameraTo({
        endCamera: flyToCamera,
        durationMillis: 5000
    });

    const handleAnimationEnd = () => {
        if (startTour) return; 
        console.log("Initial flight complete. Starting continuous circular orbit around first attraction node intervals Advanced continuous.");
        mapElement.flyCameraAround({
            camera: flyToCamera,
            durationMillis: 35000,
            repeatCount: 0
        });
    };

    mapElement.addEventListener('gmp-animationend', handleAnimationEnd, { once: true });
    setInitialFlightDone(true); 

  }, [mapElement, waypointCoords, startTour, initialFlightDone]);

  // click selection Updates desynchronisation pacing transparent node Continuous load accurately scoped correctly
  useEffect(() => {
    if (!mapElement || !data?.location || startTour || !initialFlightDone) return;

    console.log("Executing Flight to Selected Attraction node intervals Advanced:", data.location);
    if (typeof mapElement.stopAnimation === 'function') {
       mapElement.stopAnimation();
    }

    const position = { lat: data.location.lat, lng: data.location.lng };
    if (position) {
      mapElement.flyCameraTo({
          endCamera: {
             center: { ...position, altitude: 150 },
             range: 1200,
             tilt: 60,
             heading: 0
          },
          durationMillis: 3000
      });
    }
  }, [mapElement, data?.location, startTour, initialFlightDone]);
  
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
    console.log("processItinerary Effect. Element:", !!mapElement, "libs:", !!markerLib, !!maps3dLib, "itinerary:", !!itinerary);
    if (!mapElement || !markerLib || !maps3dLib || !itinerary) {
      return;
    }
    const map = mapElement as unknown as google.maps.Map;

    // Clear existing elements
    markers.forEach(marker => marker.remove());
    if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
    }
    const newMarkers: HTMLElement[] = [];

    const processItinerary = async () => {
        const locations = itinerary.flatMap(day => day.locations);
        const geocodedLocations: google.maps.LatLngLiteral[] = [];
        const newTourLocations: Array<{ coords: google.maps.LatLngLiteral; details: any }> = [];
        console.log("processItinerary: Locations to process:", locations.map(l => `${l.name} (${l.address})`));

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (const location of locations) {
          console.log("processItinerary: Processing:", location.name, "Address:", location.address);
          
          let position: google.maps.LatLngLiteral | null = null;

          if (location.address && location.address !== "Address not available") {
            position = await geocodeAddress(location.address);
          } 
          
          // Fallback to Location Name title desync Node operators Continuous Continuous Continuous correctly
          if (!position && location.name) {
             const destinationName = data?.location?.name || "";
             const query = destinationName ? `${location.name}, ${destinationName}` : location.name;
             console.log("processItinerary: Fallback Geocoding Name setup mechanics desync Workspace:", query);
             position = await geocodeAddress(query);
          }

          console.log("processItinerary: Geocode for", location.name, "->", position);

          if (position) {
              geocodedLocations.push(position);
              newTourLocations.push({ coords: position, details: location });

              const icon = getIconForLocation(location.name);

              const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              svgElement.setAttribute('width', '40');
              svgElement.setAttribute('height', '40');
              svgElement.setAttribute('viewBox', '0 0 40 40');
              
              const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              circle.setAttribute('cx', '20');
              circle.setAttribute('cy', '20');
              circle.setAttribute('r', '18');
              circle.setAttribute('fill', 'white');
              circle.setAttribute('stroke', '#cbd5e1'); // slate-300
              circle.setAttribute('stroke-width', '1');
              
              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              text.setAttribute('x', '20');
              text.setAttribute('y', '27');
              text.setAttribute('font-size', '20');
              text.setAttribute('text-anchor', 'middle');
              text.textContent = icon;
              
              svgElement.appendChild(circle);
              svgElement.appendChild(text);
              
              const markerEl = document.createElement('gmp-marker-3d');
              markerEl.setAttribute('position', `${position.lat},${position.lng}`);
              
              const template = document.createElement('template');
              template.content.appendChild(svgElement);
              markerEl.appendChild(template);
              
              mapElement.appendChild(markerEl);
              newMarkers.push(markerEl);
          }

          // Rate-Throttling intervals desynchronization setup framed Continuous loading Continuous 
          await sleep(300);
        }
        setMarkers(newMarkers);
        setWaypointCoords(geocodedLocations);
        setTourLocations(newTourLocations);
        console.log("processItinerary: setWaypointCoords complete. Count:", geocodedLocations.length);

        if(geocodedLocations.length > 1) {
            const apiClient = new RoutesApi(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!);
            const origin = geocodedLocations[0];
            const destination = geocodedLocations[geocodedLocations.length - 1];
            const waypoints = geocodedLocations.slice(1, -1);

            try {
                const res = await apiClient.computeRoutes(origin, destination, waypoints);
                const [route] = res.routes;
                const { geoJsonLinestring } = route.polyline ?? {};
                
                if(geoJsonLinestring && mapElement) {
                    const coordinates = geoJsonLinestring.coordinates.map(([lng, lat]) => ({
                        lat,
                        lng,
                        altitude: 2
                      }));
              
                      const polyline3d = new maps3dLib.Polyline3DElement({
                        altitudeMode: maps3dLib.AltitudeMode.RELATIVE_TO_GROUND,
                        coordinates,
                        strokeColor: '#2563eb', // Sleek vibrant blue
                        strokeWidth: 6
                      });
                      
                      mapElement.append(polyline3d);
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
        newMarkers.forEach(marker => marker.remove());
        if (polylineRef.current) {
            polylineRef.current.remove();
        }
    };

  }, [mapElement, itinerary, markerLib, maps3dLib]);

  const onTourEndRef = useRef(onTourEnd);
  
  useEffect(() => {
    onTourEndRef.current = onTourEnd;
  }, [onTourEnd]);

  useEffect(() => {
    console.log("Recursive Tour Trigger Effect. startTour:", startTour, "Waypoints count:", waypointCoords.length);
    
    if (!startTour || waypointCoords.length === 0 || !mapElement) {
      return;
    }

    let isCancelled = false;

    const runTour = (index: number) => {
       if (isCancelled || index >= waypointCoords.length) {
          console.log("Tour recursion finished or cancelled. Index:", index, "Total Waypoints:", waypointCoords.length);
          setCurrentTourIndex(-1);
          if (onTourEndRef.current) onTourEndRef.current();
          return;
       }

       setCurrentTourIndex(index);
       
       const stop = waypointCoords[index];
       console.log("Executing Tour Flight node to index:", index, "Coordinates:", stop);
       
       let targetHeading = 0;
       if (index + 1 < waypointCoords.length) {
         const nextStop = waypointCoords[index + 1];
         targetHeading = computeHeading(stop, nextStop);
         console.log("Computed heading to next stop:", targetHeading);
       }

       // Fallback timeout advancing mechanics frames responsibly Continuous
       const fallbackTimeoutId = setTimeout(() => {
          console.log("Animation Fallback Trigger Advance index:", index + 1);
          mapElement.removeEventListener('gmp-animationend', handleAnimEnd);
          if (!isCancelled) {
             runTour(index + 1);
          }
       }, 13000); // Matches the new helicopter duration plus padding

       const handleAnimEnd = (e: any) => {
          console.log("Recursive Tour Step Animation completed natively. Index completed:", index);
          clearTimeout(fallbackTimeoutId);
          mapElement.removeEventListener('gmp-animationend', handleAnimEnd);
          
          if (!isCancelled) {
             console.log("Moving to next tour nodeIndex:", index + 1);
             runTour(index + 1);
          }
       };

       // Add listener BEFORE triggering animation
       mapElement.addEventListener('gmp-animationend', handleAnimEnd);

       console.log("Calling flyCameraTo for index:", index);
       mapElement.flyCameraTo({
          endCamera: {
             center: { ...stop, altitude: 180 }, // Helicopter viewing height
             range: 1200, // Slightly more zoomed out for helicopter grand view
             tilt: 45, // Looking down more
             heading: targetHeading
          },
          durationMillis: 12000 // Helicopter speed (slower)
       });
    };

    // Start recursion cycle setups triggers sequential spacing correctly securely framing setups Workspace continuously chained
    runTour(0);

    return () => {
       console.log("Recursive Tour Effect Cleanup triggered frameworks spaces continuous spaces framed securely lock triggers");
       isCancelled = true;
    };

  }, [startTour, waypointCoords, mapElement]);

  const currentDisplayPlace = (startTour && currentTourIndex >= 0 && tourLocations[currentTourIndex])
    ? tourLocations[currentTourIndex].details
    : data?.place;

  if (!data?.location) {
    return null;
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Floating Header Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md">
        <h2 className="text-lg font-bold font-headline text-slate-900">
          {data.location.name}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Photorealistic 3D Map
        </p>
      </div>

      {/* Absolute Map viewport Canvas */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Map3D
          ref={setMapElement}
          map-id="21b670ae378cc0c7ef920de7"
          style={{ height: '100%', width: '100%' }}
          defaultUIDisabled={true}
        />
      </div>

      {/* Floating Place Card Overlay */}
      {currentDisplayPlace && (
        <div className="absolute top-4 right-4 z-10 w-80 pointer-events-auto max-h-[calc(100vh-32px)] overflow-y-auto rounded-xl shadow-xl">
          <PlaceCard place={currentDisplayPlace} />
        </div>
      )}
    </div>
  );
}
