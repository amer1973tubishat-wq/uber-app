"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so the map only renders in the browser.
const MapView = dynamic(() => import("./RideMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[var(--surface-2)]" />,
});

export default MapView;
