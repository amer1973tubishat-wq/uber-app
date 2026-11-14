import type { Driver, LatLng } from "./types";

// Simulated drivers. A real app would get these from a dispatch backend.
const NAMES = ["Omar", "Lina", "Yousef", "Rania", "Khaled", "Sara", "Ahmad", "Dina"];
const CARS = ["Toyota Corolla", "Hyundai Elantra", "Kia K5", "Toyota Camry", "Hyundai Tucson"];
const COLORS = ["White", "Silver", "Black", "Grey", "Blue"];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomDriver(): Driver {
  return {
    name: pick(NAMES),
    rating: Math.round((4.6 + Math.random() * 0.4) * 100) / 100,
    car: `${pick(COLORS)} ${pick(CARS)}`,
    plate: `${10 + Math.floor(Math.random() * 80)}-${10000 + Math.floor(Math.random() * 89999)}`,
  };
}

/** A start point roughly 1–2 km from `near`, where the driver begins. */
export function driverStart(near: LatLng): LatLng {
  const angle = Math.random() * Math.PI * 2;
  const dist = 0.009 + Math.random() * 0.009; // degrees ≈ 1–2 km
  return { lat: near.lat + Math.sin(angle) * dist, lng: near.lng + Math.cos(angle) * dist };
}

export function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  const k = Math.min(1, Math.max(0, t));
  return { lat: a.lat + (b.lat - a.lat) * k, lng: a.lng + (b.lng - a.lng) * k };
}

/** 4-digit code the rider tells the driver to confirm the right car. */
export function tripPin(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}
