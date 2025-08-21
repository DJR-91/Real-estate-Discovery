"use client";

import React, { useEffect, useRef } from 'react';
import type { MapData } from '@/app/page';

// Correct TypeScript declarations for the 'gmp-map-3d' element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-map-3d': any; // Use 'any' for simplicity with web components in React/TSX
    }
  }
}

export default function MapDisplay({ data }: { data: MapData }) {
  const mapRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!data?.location) {
      return;
    }

    const initAndAnimateMap = async () => {
      if (!mapRef.current) {
        return;
      }
      
      const map = mapRef.current;

      try {
        const locationCoordinates = { lat: data.location.lat, lng: data.location.lng };

        // Define the camera state for the animations using the dynamic location
        const cameraOptions = {
            center: locationCoordinates,
            range: 800,
            tilt: 75,
            heading: 330,
        };

        // Set initial properties directly on the element
        map.center = locationCoordinates;
        map.mode = "satellite";
        map.defaultUIDisabled = true;
        map.tilt = 75;
        map.heading = 270;
        map.range = 2000;
        
        // Fly to the location
        await map.flyTo(cameraOptions, { duration: 4000 });
        
        // Orbit around the location
        map.orbit(cameraOptions, {
          duration: 25000,
          rotations: Infinity
        });

      } catch (error) {
          console.error("Failed to initialize or animate Google Maps 3D:", error);
      }
    };
    
    initAndAnimateMap();

  }, [data]);

  return (
    <div style={{ 
        backgroundColor: '#1a202c', 
        color: 'white', 
        borderRadius: '0.75rem', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        animation: 'fadeIn 0.5s ease-in-out'
    }}>
      <div style={{ padding: '1.5rem' }}>
         <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--primary))' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>Photorealistic 3D Map</span>
        </h2>
        <p style={{ marginTop: '0.5rem', color: '#a0aec0' }}>
          Flying to the first recommended location: {data.location.name}.
          <br />
          <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#718096' }}>
            Coordinates: {data.location.lat.toFixed(6)}, {data.location.lng.toFixed(6)}
          </span>
        </p>
      </div>
      <div style={{ padding: '1.5rem', paddingTop: 0 }}>
        <gmp-map-3d 
            ref={mapRef} 
            style={{ height: '500px', width: '100%', borderRadius: '0.5rem', background: '#e0e0e0' }} 
            data-ai-hint="3d map display">
        </gmp-map-3d>
      </div>
       <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
