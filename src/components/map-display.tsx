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

// Define a more specific type for the 3D Map HTML Element
interface Map3DElement extends HTMLElement {
  center: { lat: number; lng: number; };
  tilt: number;
  heading: number;
  range: number;
  defaultUIDisabled: boolean;
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
    if (!data?.location) {
      console.warn("MapDisplay: No location data provided in props.");
      return;
    }

    const initMap = async () => {
      if (!mapRef.current) {
        return;
      }

      const { lat, lng } = data.location;

      // Validate the coordinates before proceeding
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates received. Halting map initialization.', { lat, lng });
        return;
      }

      const map = mapRef.current;
      
      const locationCoordinates = { lat, lng };

      try {
        // Set initial map properties directly
        map.center = locationCoordinates;
        map.defaultUIDisabled = true;
        map.tilt = 75;
        map.heading = 330;
        map.range = 1000; // altitude
        
      } catch (error) {
          console.error("Failed to initialize Google Maps 3D:", error);
      }
    };
    
    if (google?.maps?.importLibrary) {
        google.maps.importLibrary('maps3d').then(() => {
            initMap();
        });
    }


  }, [data]);

  if (!data?.location) {
    return null;
  }

  return (
    <div style={{ 
        backgroundColor: '#1a202c', 
        color: 'white', 
        borderRadius: '0.75rem', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        animation: 'fadeIn 0.5s ease-in-out'
    }}>
      <div style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'sans-serif' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>Photorealistic 3D Map</span>
        </h2>
        <p style={{ marginTop: '0.5rem', color: '#a0aec0' }}>
          Displaying: <b>{data.location.name}</b>
          <br />
          <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#718096' }}>
            Coords: {Number(data.location.lat).toFixed(6)}, {Number(data.location.lng).toFixed(6)}
          </span>
        </p>
      </div>
      <div style={{ padding: '1.5rem', paddingTop: 0 }}>
        <gmp-map-3d 
          ref={mapRef} 
          style={{ height: '500px', width: '100%', borderRadius: '0.5rem', background: '#e0e0e0' }}
        ></gmp-map-3d>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
