"use client";

import React, { useEffect, useRef } from 'react';

// Define the type for the data you'll pass as a prop
export type MapData = {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
};

// Define a more specific TypeScript type for the 3D Map HTML Element
interface Map3DElement extends HTMLElement {
  center: { lat: number; lng: number; altitude: number; };
  defaultUIDisabled: boolean;
  tilt: number;
  heading: number;
  range: number; // Used to control camera distance
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
    map.range = 2000; // Sets the camera's distance from the center in meters
    map.tilt = 75;    // Sets the camera's viewing angle
    map.heading = 330;  // Sets the camera's compass direction
    map.defaultUIDisabled = true; // Hides the default map controls

  }, [data]); // Rerun this effect if the `data` prop changes

  if (!data?.location) {
    return null; // Don't render anything if there's no location data
  }

  // Render the component's JSX
  return (
    <div style={{ 
        backgroundColor: '#1a202c', 
        color: 'white', 
        borderRadius: '0.75rem', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
          Photorealistic 3D Map
        </h2>
        <p style={{ marginTop: '0.5rem', color: '#a0aec0' }}>
          Displaying: <b>{data.location.name}</b>
        </p>
      </div>
      <div style={{ padding: '1.5rem', paddingTop: 0 }}>
        <gmp-map-3d 
          map-id="21b670ae378cc0c7ef920de7" 
          ref={mapRef} 
          style={{ height: '500px', width: '100%', borderRadius: '0.5rem', background: '#e0e0e0' }}
        ></gmp-map-3d>
      </div>
    </div>
  );
}