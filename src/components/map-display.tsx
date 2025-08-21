"use client";

import React, { useEffect, useRef } from 'react';

// Define the type for your map data structure
export type MapData = {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
};

// Define a more specific type for the 3D Map HTML Element, including the correct center property
interface Map3DElement extends HTMLElement {
  center: { lat: number; lng: number; altitude: number };
  defaultUIDisabled: boolean;
  tilt: number;
  heading: number;
  range: number; // Used to control camera distance
}

// Update the global JSX namespace for TypeScript
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
    if (!data?.location) return;

    const initStaticMap = () => {
      if (!mapRef.current) return;

      const lat = parseFloat(data.location.lat as any);
      const lng = parseFloat(data.location.lng as any);

      if (isNaN(lat) || isNaN(lng)) {
        console.error("Invalid coordinates provided to MapDisplay.", { lat, lng });
        return;
      }

      const map = mapRef.current;
      
      // Use the correct structure for center, including the hardcoded altitude.
      const locationCoordinates = { lat, lng, altitude: 100 };

      // --- Set Initial Map Properties (No Animation) ---
      map.center = locationCoordinates;
      map.defaultUIDisabled = true;
      map.tilt = 75;
      map.heading = 330;
      map.range = 100; // This controls camera distance/zoom, distinct from center altitude
    };
    
    initStaticMap();

  }, [data]);

  if (!data?.location) {
    return null;
  }

  // Render JSX
  return (
    <div style={{ 
        backgroundColor: '#1a202c', 
        color: 'white', 
        borderRadius: '0.75rem', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        animation: 'fadeIn 0.5s ease-in-out'
    }}>
      <div style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
          Photorealistic 3D Map
        </h2>
        <p style={{ marginTop: '0.5rem', color: '#a0aec0' }}>
          Displaying location: <b>{data.location.name}</b>
        </p>
      </div>
      <div style={{ padding: '1.5rem', paddingTop: 0 }}>
        <gmp-map-3d 
          ref={mapRef} 
          style={{ height: '500px', width: '100%', borderRadius: '0.5rem', background: '#e0e0e0' }}
        ></gmp-map-3d>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}} />
    </div>
  );
}
