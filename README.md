# Roam — ride booking app

A ride-hailing web app built with Next.js, TypeScript, Tailwind CSS and Leaflet/OpenStreetMap.

## Features

- **Pickup and drop-off**: search a list of places, or choose “Choose on map” and tap the map. A swap button reverses the route.
- **Ride options with upfront prices**: Go, Comfort, XL and Premium, each with a fare, a price range, seat count and driver arrival time.
- **Demand pricing**: fares go up during commute hours and late at night, and the app says so.
- **Schedule a ride** for a later time, or ride now.
- **Live trip flow (simulated)**: finding a driver → driver on the way (with a moving car on the map) → on trip → arrived.
- **Safety**: a 4-digit PIN to confirm the right car, a share-trip button, and an emergency call button during the trip.
- **Rating and trip history**: rate the driver; past and upcoming trips are saved in the browser (localStorage). Upcoming scheduled rides can be cancelled.

Drivers and trip movement are simulated in the browser. There is no backend yet.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Customize

- **City, currency and places**: `src/lib/config.ts` (`CITY`, `PLACES`). It is set up for Amman with prices in JOD.
- **Ride tiers and fares**: `RIDE_TYPES` in `src/lib/config.ts`. Fare = (base + per-km × distance + per-minute × time) × demand, never below the minimum fare.
- **Pricing and time estimates**: `src/lib/pricing.ts`.
- **Simulation speed and fake drivers**: `src/components/RideApp.tsx` (`SEARCH_MS`, `ARRIVE_MS`, `TRIP_MS`) and `src/lib/simulation.ts`.

## Project layout

```
src/app/            page and layout
src/components/     RideApp (main screen), RideMap (Leaflet map), PlaceInput, TripsList
src/lib/            config, pricing, simulation, browser stores
```

## Possible next steps

- Real address search and road routes (e.g. a geocoding and routing API) instead of the place list and straight lines
- A backend with accounts, real drivers and payments
- A driver-side app
