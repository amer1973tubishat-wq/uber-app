"use client";

import { useSyncExternalStore } from "react";
import type { TripRecord } from "./types";

/* ---------- Current time, refreshed every 30 s (null during prerender) ---------- */

let nowSnapshot: Date | null = null;

function subscribeNow(onChange: () => void) {
  nowSnapshot = new Date();
  const timer = setInterval(() => {
    nowSnapshot = new Date();
    onChange();
  }, 30_000);
  return () => clearInterval(timer);
}

export function useNow(): Date | null {
  return useSyncExternalStore(
    subscribeNow,
    () => nowSnapshot,
    () => null,
  );
}

/* ---------- Trip history kept in localStorage ---------- */

const KEY = "roam.trips.v1";
const EMPTY: TripRecord[] = [];
const listeners = new Set<() => void>();
let cache: TripRecord[] | null = null;

function read(): TripRecord[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as TripRecord[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(trips: TripRecord[]) {
  cache = trips;
  try {
    localStorage.setItem(KEY, JSON.stringify(trips));
  } catch {
    // Storage may be unavailable (private mode); keep the in-memory copy.
  }
  listeners.forEach((l) => l());
}

export function useTrips(): TripRecord[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}

export function saveTrip(trip: TripRecord) {
  write([trip, ...read().filter((t) => t.id !== trip.id)].slice(0, 50));
}

export function removeTrip(id: string) {
  write(read().filter((t) => t.id !== id));
}
