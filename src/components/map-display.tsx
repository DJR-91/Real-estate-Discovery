"use client";
import React, { useEffect, useRef } from 'react';
import type { MapData } from '@/app/page';

// TypeScript declarations for the 'gmp-map-3d' custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-map-3d': any; // Using 'any' simplifies interaction with web component properties and methods
    }
  }
}

export default function MapDisplay({ data }: { data: MapData }) {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Exit early if there's no location data
    if (!data?.location) {
      return;
    }

    const initAndAnimateMap = async () => {
      if (!mapRef.current) {
        return;
      }

      const map = mapRef.current;

      try {
        // 1. Explicitly parse lat and lng to ensure they are valid numbers
        const lat = parseFloat(data.location.lat as any);
        const lng = parseFloat(data.location.lng as any);

        // 2. Validate the parsed coordinates before using them
        if (isNaN(lat) || isNaN(lng)) {
          console.error("Invalid or missing coordinates provided:", data.location);
          return; // Stop execution if coordinates are not valid numbers
        }

        const locationCoordinates = { 
          lat: lat, 
          lng: lng
        };
        
        // Set initial map properties
        map.center = locationCoordinates;
        map.defaultUIDisabled = true;
        map.tilt = 75;
        map.heading = 270;
        map.range = 100;
        // NOTE: The line 'map.mode = "satellite"' was removed as it's not a valid mode for gmp-map-3d

      } catch (error) {
          console.error("Failed to initialize or animate Google Maps 3D:", error);
      }
    };

    initAndAnimateMap();
  }, [data]); // Rerun this effect if the 'data' prop changes

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
          Showing the first recommended location: {data.location.name}.
          <br />
          <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#718096' }}>
            Coordinates: {Number(data.location.lat).toFixed(6)}, {Number(data.location.lng).toFixed(6)}
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
