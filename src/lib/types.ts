export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place extends LatLng {
  id: string;
  name: string;
  area: string;
}

export interface RideType {
  id: string;
  name: string;
  description: string;
  seats: number;
  icon: string;
  base: number;
  perKm: number;
  perMin: number;
  minFare: number;
  /** Extra minutes added to driver arrival time (fewer cars of this tier). */
  etaPadMin: number;
}

export interface TripEstimate {
  distanceKm: number;
  durationMin: number;
}

export interface Driver {
  name: string;
  rating: number;
  car: string;
  plate: string;
}

export type TripPhase =
  | "idle"
  | "searching"
  | "arriving"
  | "onTrip"
  | "completed";

export interface TripRecord {
  id: string;
  pickup: Place;
  dropoff: Place;
  rideTypeId: string;
  fare: number;
  distanceKm: number;
  durationMin: number;
  /** ISO time the trip was requested or scheduled for. */
  when: string;
  scheduled: boolean;
  driver?: Driver;
  rating?: number;
}
