import type { LatLng, Place, RideType } from "./types";

/** City the app is configured for. Change these values to launch elsewhere. */
export const CITY = {
  name: "Amman",
  center: { lat: 31.9539, lng: 35.9106 } satisfies LatLng,
  zoom: 13,
  currency: "JOD",
  locale: "en-JO",
};

/** Sample places offered as quick picks in the search boxes. */
export const PLACES: Place[] = [
  { id: "abdali", name: "Abdali Boulevard", area: "Abdali", lat: 31.9632, lng: 35.9116 },
  { id: "rainbow", name: "Rainbow Street", area: "Jabal Amman", lat: 31.9505, lng: 35.9227 },
  { id: "citadel", name: "Amman Citadel", area: "Jabal al-Qal'a", lat: 31.9545, lng: 35.9346 },
  { id: "roman", name: "Roman Theatre", area: "Downtown", lat: 31.9517, lng: 35.9392 },
  { id: "uj", name: "University of Jordan", area: "Al-Jubeiha", lat: 32.0137, lng: 35.8724 },
  { id: "citymall", name: "City Mall", area: "King Abdullah II St", lat: 31.9798, lng: 35.8344 },
  { id: "mecca", name: "Mecca Mall", area: "Mecca St", lat: 31.9773, lng: 35.8442 },
  { id: "sweifieh", name: "Sweifieh Village", area: "Sweifieh", lat: 31.9558, lng: 35.8622 },
  { id: "kingabdullah", name: "King Abdullah I Mosque", area: "Al-Abdali", lat: 31.9605, lng: 35.9233 },
  { id: "khalda", name: "Khalda Circle", area: "Khalda", lat: 31.9993, lng: 35.8378 },
  { id: "4th", name: "4th Circle", area: "Jabal Amman", lat: 31.9563, lng: 35.8988 },
  { id: "airport", name: "Queen Alia International Airport", area: "Airport Rd", lat: 31.7226, lng: 35.9932 },
];

/**
 * Ride tiers. Fares are computed in src/lib/pricing.ts as
 * (base + perKm·km + perMin·min) × surge, never below minFare.
 */
export const RIDE_TYPES: RideType[] = [
  {
    id: "go",
    name: "Go",
    description: "Affordable everyday rides",
    seats: 4,
    icon: "🚗",
    base: 0.35,
    perKm: 0.28,
    perMin: 0.04,
    minFare: 1.2,
    etaPadMin: 0,
  },
  {
    id: "comfort",
    name: "Comfort",
    description: "Newer cars with extra legroom",
    seats: 4,
    icon: "🚙",
    base: 0.5,
    perKm: 0.36,
    perMin: 0.05,
    minFare: 1.8,
    etaPadMin: 2,
  },
  {
    id: "xl",
    name: "XL",
    description: "Room for groups up to 6",
    seats: 6,
    icon: "🚐",
    base: 0.75,
    perKm: 0.48,
    perMin: 0.07,
    minFare: 2.5,
    etaPadMin: 3,
  },
  {
    id: "black",
    name: "Premium",
    description: "High-end cars, top-rated drivers",
    seats: 4,
    icon: "🚘",
    base: 1.2,
    perKm: 0.7,
    perMin: 0.1,
    minFare: 4,
    etaPadMin: 5,
  },
];
