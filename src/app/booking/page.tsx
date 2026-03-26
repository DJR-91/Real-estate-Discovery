"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, PlaneIcon, MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapDisplay from "@/components/map-display";
import type { GenerateItineraryOutput } from "@/ai/schemas/itinerary-schema";
import type { MapData } from "@/app/page";
import { generateFunFactsAction } from "@/actions/fun-facts";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { HeartIcon } from "lucide-react";
import Image from "next/image";
import LiveAssistantPanel from "@/components/live-assistant-panel";
import { useLiveStore } from "@/store/live-store";
import { geocodeAddress } from "@/utils/geocoding";

export default function BookingPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<GenerateItineraryOutput['itinerary'] | null>(null);
  const mapData = useLiveStore(state => state.mapData);
  const setMapData = useLiveStore(state => state.setMapData);
  const activeDay = useLiveStore(state => state.activeDay);
  const setActiveDay = useLiveStore(state => state.setActiveDay);
  const [funFacts, setFunFacts] = useState<Record<string, string>>({});
  const [isFactsLoading, setIsFactsLoading] = useState(false);
  const { toast } = useToast();
  const [isTouring, setIsTouring] = useState(false);
  const tourIndex = useLiveStore(state => state.tourIndex);

  useEffect(() => {
    const itineraryStr = localStorage.getItem('activeItinerary');
    const mapStr = localStorage.getItem('mapData');
    if (itineraryStr) {
      const parsedItin = JSON.parse(itineraryStr);
      setItinerary(parsedItin);
    }
    if (mapStr) setMapData(JSON.parse(mapStr));
  }, []);

  // Sync with Live Store for Voice Agent
  useEffect(() => {
    if (itinerary && mapData) {
      // Lazy import/use state setter
      import('@/store/live-store').then(({ useLiveStore }) => {
         useLiveStore.setState({ itineraryData: { itinerary, destination: mapData.location.name }, tourIndex: 0 });
      });
    }
  }, [itinerary, mapData]);

  useEffect(() => {
    if (!itinerary || itinerary.length === 0) return;
    
    const loadFacts = async () => {
      const dayLocations = itinerary[activeDay].locations;
      
      // Filter locations that don't have facts yet to avoid redundant fetching
      const missingFacts = dayLocations.filter(l => !funFacts[l.name]);
      if (missingFacts.length === 0) return;

      setIsFactsLoading(true);
      try {
        const res = await generateFunFactsAction(missingFacts.map(l => ({ name: l.name, address: l.address })));
        const factsMap: Record<string, string> = {};
        res.facts.forEach(f => {
          factsMap[f.locationName] = f.funFact;
        });
        setFunFacts(prev => ({ ...prev, ...factsMap }));
      } catch (e) {
        console.error("Facts fetch failed", e);
      } finally {
        setIsFactsLoading(false);
      }
    };
    
    loadFacts();
  }, [activeDay, itinerary, funFacts]);

// Using imported geocodeAddress utility instead of local

  const handleMapLocationSelect = async (loc: { name: string; address?: string }) => {
    let targetAddress = loc.address;
    
    if (!targetAddress || targetAddress === "Address not available") {
       const destination = mapData?.location?.name || "";
       targetAddress = destination ? `${loc.name}, ${destination}` : loc.name;
       console.log("handleMapLocationSelect: Fallback address geocoding via location Name setup:", targetAddress);
    }

    try {
      const coords = await geocodeAddress(targetAddress);
      setMapData({
        location: {
          name: loc.name,
          lat: coords.lat,
          lng: coords.lng,
        },
        place: loc as any
      });
    } catch (e) {
      console.error("Geocoding failed for selection click:", e);
    }
  };

  useEffect(() => {
    console.log("[BookingPage] tourIndex sync triggered. tourIndex:", tourIndex);
    if (tourIndex >= 0 && itinerary) {
      const activeDayLocations = itinerary[activeDay]?.locations || [];
      if (tourIndex < activeDayLocations.length) {
         const loc = activeDayLocations[tourIndex];
         console.log("[BookingPage] Geocoding for automatic live stop sync:", loc.name);
         handleMapLocationSelect(loc);
      }
    }
  }, [tourIndex, itinerary, activeDay]);

  const handleSaveTrip = () => {
    if (!itinerary) return;
    const savedStr = localStorage.getItem('savedTrips') || '[]';
    const savedList = JSON.parse(savedStr);
    
    const newTrip = {
      id: Date.now().toString(),
      name: currentDayLocations[0]?.name ? `Trip with stops at ${currentDayLocations[0].name}` : "Dynamic Trip",
      itinerary,
      mapData,
      savedAt: new Date().toLocaleString()
    };
    
    savedList.push(newTrip);
    let success = false;
    let attempts = 0;
    const maxAttempts = savedList.length;

    while (!success && savedList.length > 0 && attempts < maxAttempts) {
      try {
        localStorage.setItem('savedTrips', JSON.stringify(savedList));
        success = true;
        toast({
            title: "Trip Saved",
            description: attempts > 0 
              ? `Trip saved. Removed ${attempts} oldest trip(s) to make space.` 
              : "Access via Find My Trip dashboard.",
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
           attempts++;
           if (savedList.length > 1) {
              savedList.shift(); // Remove oldest
           } else {
              break; // Individual trip item limit anchor offset securely framed 
           }
        } else {
           throw e;
        }
      }
    }

    if (!success) {
      toast({
          variant: "destructive",
          title: "Storage Full",
          description: "Cannot save trip. Details are too large for browser storage limits.",
      });
    }
  };

  // Memoize filteredItineary to ensure stable reference unless activeDay changes triggers continuous setups securely spaced sequenced
  const filteredItineary = useMemo(() => {
    if (!itinerary || itinerary.length === 0) return [];
    return [itinerary[activeDay]];
  }, [itinerary, activeDay]);

  if (!itinerary || itinerary.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900">
          <div className="animate-spin mb-4"><PlaneIcon size={48} className="text-blue-500" /></div>
          <p className="text-lg text-slate-400">Hydrating Trip Data...</p>
        </div>
      );
  }

  const currentDayLocations = itinerary[activeDay]?.locations || [];

  return (
    <main className="flex flex-col md:flex-row h-[calc(100vh-100px)] w-full bg-white text-slate-900 overflow-hidden">
      {/* Left Content Sidebar */}
      <div className="w-full md:w-2/5 h-full overflow-y-auto border-r border-slate-200 bg-slate-50/95 flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
          <div className="flex items-center gap-2">
             <Button size="sm" variant="outline" onClick={handleSaveTrip} className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full px-3 h-7 flex items-center gap-1 text-xs font-bold">
                <HeartIcon size={12} fill="currentColor" /> Save
             </Button>
             <div className="text-xs font-bold tracking-wider text-blue-600 uppercase">Details View</div>
          </div>
        </div>

        <div className="p-6 flex-grow space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Review Your Itinerary</h1>
              <p className="text-sm text-slate-600 mt-1">Enjoy daily guides and immersive full context.</p>
            </div>
            <Button 
              size="sm" 
              variant={isTouring ? "destructive" : "default"}
              onClick={() => setIsTouring(!isTouring)} 
              className={`rounded-full px-4 flex items-center gap-1 font-semibold shadow-md transition-all ${isTouring ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
            >
               <PlaneIcon size={14} className={isTouring ? "animate-bounce" : ""} /> 
               {isTouring ? "Stop Tour" : "Flythrough Tour"}
            </Button>
          </div>

          {/* Day Selector */}
          <div className="flex flex-wrap gap-2 p-1 bg-slate-200/60 rounded-lg w-max">
            {itinerary.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDay(idx)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeDay === idx 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-600 hover:bg-slate-300/50"
                }`}
              >
                Day {idx + 1}
              </button>
            ))}
          </div>

          <Separator className="bg-slate-200" />

          {/* Locations list for that day */}
          <div className="space-y-6">
             <h2 className="text-xl font-semibold font-headline text-slate-800 flex items-center gap-2">
               <Sparkles size={18} className="text-blue-500"/> Day {activeDay+1} Attractions
             </h2>
             
             <div className="space-y-4">
               {currentDayLocations.map((loc, index) => (
                 <Card key={index} className="bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
                   <CardContent className="p-4 flex gap-4 items-start">
                     {loc.imageUrl && (
                       <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                         <img src={loc.imageUrl} alt={loc.name} className="object-cover w-full h-full" />
                       </div>
                     )}
                     <div className="flex-grow min-w-0">
                       <h3 className="text-md font-bold text-slate-900 leading-snug truncate">{loc.name}</h3>
                       {loc.address && (
                         <div className="flex items-center text-xs text-slate-500 mt-1 gap-1">
                           <MapPinIcon size={12} /> 
                           <span className="truncate">{loc.address}</span>
                         </div>
                       )}
                       <p className="text-slate-600 text-sm mt-2 leading-snug">{loc.description}</p>
                       
                       {/* Fun Fact Frame */}
                       <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                         <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                           <Sparkles size={12} /> Fun Fact
                         </div>
                         <p className="text-slate-700 text-sm mt-1 italic">
                            {funFacts[loc.name] ? funFacts[loc.name] : isFactsLoading ? "Discovering..." : "..." }
                         </p>
                       </div>
                       
                       {loc.address && loc.address !== "Address not available" && (
                          <div className="mt-2 flex justify-end">
                             <Button size="sm" variant="ghost" onClick={() => handleMapLocationSelect(loc)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 p-2 h-auto text-xs font-semibold flex items-center gap-1 rounded-md">
                                View on Map
                             </Button>
                          </div>
                       )}
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Right 3D Map viewport */}
      <div className="w-full md:w-3/5 h-full relative">
        {mapData ? (
           <MapDisplay 
             data={mapData} 
             itinerary={filteredItineary} 
             startTour={isTouring} 
             onTourEnd={() => setIsTouring(false)} 
           />
        ) : (
          <div className="flex items-center justify-center h-full bg-white">
             <p className="text-slate-400">3D Map visualization preparing...</p>
          </div>
        )}
      </div>

      {/* Live Voice Assistant UI */}
      <LiveAssistantPanel />
    </main>
  );
}
