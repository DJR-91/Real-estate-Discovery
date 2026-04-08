'use client';

import Link from 'next/link';
import { Menu, X, Plane, Heart, PhoneCall, Home } from 'lucide-react';
import { useState } from 'react';

export default function PricelineMobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-14 bg-[#003580] flex items-center justify-between px-4 z-50 border-b border-blue-800">
          <div className="flex items-center h-full gap-3">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 -ml-1 hover:bg-blue-800 rounded-full transition-colors">
                {isMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
              <div className="h-6 w-px bg-blue-700" />
              <Link href="/during-trip/homescreen">
                <span className="text-xl font-bold font-sans tracking-tight text-white">Booking.com</span>
              </Link>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-1 border border-white/20 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center text-[10px] font-bold font-mono">G</div>
                  <span className="text-xs font-bold text-white tracking-wide">GOLD</span>
              </div>
              <span className="text-sm font-semibold text-white">Andy</span>
          </div>
      </div>

      {/* Dropdown Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed top-14 left-0 right-0 bottom-0 bg-black/30 z-40 transition-opacity" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute top-0 left-0 right-0 bg-[#003580] shadow-xl animate-slide-down border-b border-blue-800 py-2 z-50" onClick={(e) => e.stopPropagation()}>
            <ul className="divide-y divide-blue-800">
              <li>
                <Link href="/during-trip/homescreen" className="flex items-center gap-3 px-5 py-3.5 hover:bg-blue-800 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <Home className="w-5 h-5 text-white/70" />
                  <span className="text-sm font-semibold text-white">Home Screen</span>
                </Link>
              </li>
              <li>
                <Link href="/during-trip/saved-trips" className="flex items-center gap-3 px-5 py-3.5 hover:bg-blue-800 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-semibold text-white">Saved Trips</span>
                </Link>
              </li>
              <li>
                <Link href="/during-trip/itinerary" className="flex items-center gap-3 px-5 py-3.5 hover:bg-blue-800 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <Plane className="w-5 h-5 text-white/70" />
                  <span className="text-sm font-semibold text-white">Itinerary</span>
                </Link>
              </li>
              <li>
                <Link href="/during-trip/mobile-call" className="flex items-center gap-3 px-5 py-3.5 hover:bg-blue-800 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <PhoneCall className="w-5 h-5 text-white/70" />
                  <span className="text-sm font-semibold text-white">Penny Assistant</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
