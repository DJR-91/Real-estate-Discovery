"use client";

import Link from "next/link";
import { Bed, Plane, Briefcase, Car, Ship, MapPin, HelpCircle, XIcon } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [showIframe, setShowIframe] = useState(false);
  return (
    <>
    <header className="w-full flex flex-col z-50 sticky top-0 bg-[#003580] text-white shadow-md">
      {/* Top Bar (Logo & Utilities) */}
      <div className="w-full h-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-white tracking-tight">Booking.com</span>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <button className="text-sm font-medium hover:bg-blue-800 px-2 py-1.5 rounded-md flex items-center h-9">
              €$£
            </button>
            <button className="hover:bg-blue-800 px-2 py-1.5 rounded-md flex items-center h-9">
              🇺🇸
            </button>
            <button className="hover:bg-blue-800 px-2.5 py-1.5 rounded-md flex items-center h-9">
              <HelpCircle size={20} className="text-white" />
            </button>
            <Link href="/during-trip" className="border border-white text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-blue-800 flex items-center h-9">
              In Trip
            </Link>
            <div className="flex items-center space-x-2 ml-2">
              <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-sm tracking-tight border-2 border-white">
                AC
              </div>
              <div className="flex flex-col text-xs">
                <span className="font-semibold text-white">andy c</span>
                <span className="text-yellow-400 text-[10px] font-medium">Genius Level 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar (Navigation Icons) */}
      <div className="w-full pb-3">
        <div className="w-full max-w-7xl mx-auto px-4">
          <nav className="flex items-center space-x-1.5 overflow-x-auto pb-1 hide-scrollbar">
            <Link href="#" className="flex items-center space-x-2 text-white border border-white rounded-full px-4 py-2.5 text-sm font-medium bg-[#ffffff20] backdrop-blur-sm">
              <Bed size={18} />
              <span>Stays</span>
            </Link>
            <Link href="#" className="flex items-center space-x-2 text-white text-sm font-medium hover:bg-blue-800 rounded-full px-4 py-2.5">
              <Plane size={18} />
              <span>Flights</span>
            </Link>
            <Link href="#" className="flex items-center space-x-2 text-white text-sm font-medium hover:bg-blue-800 rounded-full px-4 py-2.5">
              <Briefcase size={18} />
              <span>Flight + Hotel</span>
            </Link>
            <Link href="#" className="flex items-center space-x-2 text-white text-sm font-medium hover:bg-blue-800 rounded-full px-4 py-2.5">
              <Car size={18} />
              <span>Car rental</span>
            </Link>
            <Link href="#" className="flex items-center space-x-2 text-white text-sm font-medium hover:bg-blue-800 rounded-full px-4 py-2.5">
              <Ship size={18} />
              <span>Cruises</span>
            </Link>
            <Link href="#" className="flex items-center space-x-2 text-white text-sm font-medium hover:bg-blue-800 rounded-full px-4 py-2.5">
              <MapPin size={18} />
              <span>Attractions</span>
            </Link>
            <Link href="#" className="flex items-center space-x-2 text-white text-sm font-medium hover:bg-blue-800 rounded-full px-4 py-2.5">
              <Car size={18} />
              <span>Airport taxis</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
    {showIframe && (
      <div className="fixed bottom-4 right-4 w-[50vw] h-[50vh] z-[100] bg-white p-4 rounded-2xl shadow-2xl flex flex-col border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">P</div>
            Penny Assistant
          </h2>
          <button className="text-gray-500 hover:text-gray-800 p-1.5 h-auto flex items-center rounded-full hover:bg-slate-100" onClick={() => setShowIframe(false)}>
            <XIcon size={16} />
          </button>
        </div>
        <div className="flex-grow w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center">
           <video 
             src="/videos/priceline_gecx_demo_2.webm" 
             className="w-full h-full object-contain" 
             controls 
             autoPlay
           />
        </div>
      </div>
    )}
    </>
  );
}
