export const geocodeAddress = (address: string): Promise<{ lat: number; lng: number; }> => {
  return new Promise((resolve, reject) => {
    const checkMapsLoaded = () => {
      if (window.google && window.google.maps) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({ lat: location.lat(), lng: location.lng() });
          } else {
            reject(new Error(`Geocoding failed for ${address}: ${status}`));
          }
        });
      } else {
        setTimeout(checkMapsLoaded, 500); // Poll every 500ms
      }
    };
    checkMapsLoaded();
  });
};
