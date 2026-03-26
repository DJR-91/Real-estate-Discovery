"use client";

import Link from "next/link";
import { Search, Gift, XIcon, Globe } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [showIframe, setShowIframe] = useState(false);
  return (
    <>
    <header className="w-full h-20 bg-white border-b border-gray-200 z-50 sticky top-0 flex items-center shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between h-full">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-[#004f32] rounded-full flex items-center justify-center text-white font-bold text-lg">
            TA
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#004f32]">Tripadvisor</span>
        </Link>

        {/* Search Bar - Oval */}
        <div className="flex-1 max-w-md mx-8 relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full h-11 bg-white border border-gray-300 rounded-full pl-12 pr-4 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004f32] focus:border-transparent transition-all shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center space-x-8">
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#" className="text-sm font-semibold text-gray-800 hover:text-[#004f32] transition-colors">Rewards</Link>
            <Link href="#" className="text-sm font-semibold text-gray-800 hover:text-[#004f32] transition-colors">Discover</Link>
            <Link href="#" className="text-sm font-semibold text-gray-800 hover:text-[#004f32] transition-colors">Review</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors">
              <Globe className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-gray-800">USD</span>

            <Link href="#" className="bg-[#004f32] text-white rounded-full px-5 py-2 text-sm font-bold hover:bg-[#003622] transition-colors shadow-sm">
              Sign In
            </Link>
          </div>
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
        <div className="flex-grow w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
           <iframe src="https://priceline-backend-721536271629.us-central1.run.app/" className="w-full h-full border-0"></iframe>
        </div>
      </div>
    )}
    </>
  );
}
