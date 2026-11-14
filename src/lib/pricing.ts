import { CITY } from "./config";
import type { LatLng, RideType, TripEstimate } from "./types";

const EARTH_RADIUS_KM = 6371;
/** Roads are longer than a straight line; scale great-circle distance. */
const ROAD_FACTOR = 1.3;
/** Average speed: ~26 km/h in town, rising toward ~58 km/h on long highway trips. */
function avgSpeedKmh(distanceKm: number): number {
  return 26 + Math.min(distanceKm, 40) * 0.8;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function estimateTrip(from: LatLng, to: LatLng): TripEstimate {
  const distanceKm = haversineKm(from, to) * ROAD_FACTOR;
  const durationMin = Math.max(2, Math.round((distanceKm / avgSpeedKmh(distanceKm)) * 60));
  return { distanceKm, durationMin };
}

/**
 * Demand multiplier by hour of day: busier at commute peaks and late night.
 * Deterministic so the same request always shows the same price.
 */
export function surgeFor(date: Date): number {
  const h = date.getHours();
  if ((h >= 7 && h < 9) || (h >= 16 && h < 19)) return 1.3;
  if (h >= 23 || h < 5) return 1.15;
  return 1;
}

export function fareFor(ride: RideType, trip: TripEstimate, surge = 1): number {
  const raw = ride.base + ride.perKm * trip.distanceKm + ride.perMin * trip.durationMin;
  return Math.max(ride.minFare, raw * surge);
}

/** A ±10% range shown before booking, like most ride apps. */
export function fareRange(fare: number): [number, number] {
  return [fare * 0.95, fare * 1.1];
}

const money = new Intl.NumberFormat(CITY.locale, {
  style: "currency",
  currency: CITY.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return money.format(value);
}
