import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useState } from "react";

export function useMapLoader() {
  const [isLoaded, setLoaded] = useState(false);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: "beta",
      libraries: ["maps3d", "places"],
    });

    loader.load().then(() => {
      setLoaded(true);
    }).catch(e => {
        console.error("Failed to load Google Maps script", e);
    });
  }, []);

  return isLoaded;
}
