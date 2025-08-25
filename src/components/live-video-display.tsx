'use client';

import React, { useEffect, useRef } from 'react';
import { useLiveAPIContext } from '@/context/live-api-context'; 

export function LiveVideoDisplay() {
  const { stream, connected } = useLiveAPIContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // When the stream from the hook is available, attach it to the video element.
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!connected || !stream) {
    return null; 
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted // Important to prevent audio feedback from your own mic
      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} // Mirror effect
    />
  );
}
