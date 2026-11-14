"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { CITY } from "@/lib/config";
import type { LatLng } from "@/lib/types";

export interface RideMapProps {
  pickup?: LatLng;
  dropoff?: LatLng;
  driver?: LatLng;
  /** When set, a map click picks that point. */
  onPick?: (point: LatLng) => void;
}

const carIcon = L.divIcon({
  className: "",
  html: '<div class="car-marker">🚗</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function ClickHandler({ onPick }: { onPick?: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Keep pickup and drop-off in view whenever they change. */
function FitBounds({ pickup, dropoff }: { pickup?: LatLng; dropoff?: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (pickup && dropoff) {
      map.fitBounds(
        [
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng],
        ],
        { padding: [60, 60], maxZoom: 15, animate: false },
      );
    } else if (pickup || dropoff) {
      const p = (pickup ?? dropoff)!;
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 14), { animate: false });
    }
  }, [map, pickup, dropoff]);
  return null;
}

export default function RideMap({ pickup, dropoff, driver, onPick }: RideMapProps) {
  return (
    <MapContainer
      center={[CITY.center.lat, CITY.center.lng]}
      zoom={CITY.zoom}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <FitBounds pickup={pickup} dropoff={dropoff} />
      {pickup && dropoff && (
        <Polyline
          positions={[
            [pickup.lat, pickup.lng],
            [dropoff.lat, dropoff.lng],
          ]}
          pathOptions={{ color: "#0f766e", weight: 5, opacity: 0.8, dashArray: "1 10", lineCap: "round" }}
        />
      )}
      {pickup && (
        <CircleMarker
          center={[pickup.lat, pickup.lng]}
          radius={9}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#0f766e", fillOpacity: 1 }}
        />
      )}
      {dropoff && (
        <CircleMarker
          center={[dropoff.lat, dropoff.lng]}
          radius={9}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#f97316", fillOpacity: 1 }}
        />
      )}
      {driver && <Marker position={[driver.lat, driver.lng]} icon={carIcon} />}
    </MapContainer>
  );
}
