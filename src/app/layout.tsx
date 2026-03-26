
if (typeof window === 'undefined') {
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

import type {Metadata} from 'next';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Script from 'next/script';
import { LiveAPIProvider } from '@/context/live-api-context';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Find Your Next Travel Experience',
  description: "Discover your next travel destination with AI-powered recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background min-h-screen" suppressHydrationWarning>
        <SiteHeader />
        <LiveAPIProvider>
          {children}
        </LiveAPIProvider>
        <Toaster />
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=beta&map_ids=21b670ae378cc0c7ef920de7&libraries=maps,marker,places,maps3d`}
          async
        />
      </body>
    </html>
  );
}
