"use client";

import { useEffect, useMemo, useState } from "react";
import MapView from "./MapView";
import PlaceInput from "./PlaceInput";
import TripsList from "./TripsList";
import { RIDE_TYPES } from "@/lib/config";
import { estimateTrip, fareFor, fareRange, formatMoney, surgeFor } from "@/lib/pricing";
import { driverStart, lerp, randomDriver, tripPin } from "@/lib/simulation";
import { saveTrip, useNow, useTrips } from "@/lib/stores";
import type { Driver, LatLng, Place, TripPhase } from "@/lib/types";

// Simulation speed: real minutes are compressed into a few seconds for the demo.
const SEARCH_MS = 2500;
const ARRIVE_MS = 8000;
const TRIP_MS = 12000;

type Picking = "pickup" | "dropoff" | null;

interface ActiveTrip {
  id: string;
  driver: Driver;
  pin: string;
  driverFrom: LatLng;
  fare: number;
}

function pinnedPlace(p: LatLng): Place {
  return {
    id: `pin-${p.lat.toFixed(5)},${p.lng.toFixed(5)}`,
    name: "Pinned location",
    area: `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
    lat: p.lat,
    lng: p.lng,
  };
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RideApp() {
  const now = useNow();
  const trips = useTrips();

  const [tab, setTab] = useState<"ride" | "trips">("ride");
  const [pickup, setPickup] = useState<Place>();
  const [dropoff, setDropoff] = useState<Place>();
  const [picking, setPicking] = useState<Picking>(null);
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [rideId, setRideId] = useState(RIDE_TYPES[0].id);

  const [phase, setPhase] = useState<TripPhase>("idle");
  const [active, setActive] = useState<ActiveTrip>();
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [notice, setNotice] = useState<string>();

  const trip = useMemo(
    () => (pickup && dropoff ? estimateTrip(pickup, dropoff) : undefined),
    [pickup, dropoff],
  );

  const scheduledDate = when === "later" && scheduledAt ? new Date(scheduledAt) : undefined;
  const priceTime = scheduledDate ?? now;
  const surge = priceTime ? surgeFor(priceTime) : 1;
  const ride = RIDE_TYPES.find((r) => r.id === rideId)!;
  const fare = trip ? fareFor(ride, trip, surge) : 0;
  const busy = phase !== "idle";

  // Advance the simulated trip through its phases.
  useEffect(() => {
    if (phase === "searching") {
      const t = setTimeout(() => {
        setProgress(0);
        setPhase("arriving");
      }, SEARCH_MS);
      return () => clearTimeout(t);
    }
    if (phase !== "arriving" && phase !== "onTrip") return;

    const duration = phase === "arriving" ? ARRIVE_MS : TRIP_MS;
    const start = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setProgress(p);
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else if (phase === "arriving") {
        setProgress(0);
        setPhase("onTrip");
      } else {
        setPhase("completed");
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // Save the trip to history once it completes.
  useEffect(() => {
    if (phase !== "completed" || !active || !pickup || !dropoff || !trip) return;
    saveTrip({
      id: active.id,
      pickup,
      dropoff,
      rideTypeId: rideId,
      fare: active.fare,
      distanceKm: trip.distanceKm,
      durationMin: trip.durationMin,
      when: new Date().toISOString(),
      scheduled: false,
      driver: active.driver,
    });
  }, [phase, active, pickup, dropoff, trip, rideId]);

  let driverPos: LatLng | undefined;
  if (active && pickup && dropoff) {
    if (phase === "arriving") driverPos = lerp(active.driverFrom, pickup, progress);
    else if (phase === "onTrip") driverPos = lerp(pickup, dropoff, progress);
    else if (phase === "completed") driverPos = dropoff;
  }

  function handleMapPick(p: LatLng) {
    if (busy) return;
    const place = pinnedPlace(p);
    if (picking === "pickup" || (!picking && !pickup)) {
      setPickup(place);
      setPicking(dropoff ? null : "dropoff");
    } else {
      setDropoff(place);
      setPicking(null);
    }
  }

  function swap() {
    setPickup(dropoff);
    setDropoff(pickup);
  }

  function request() {
    if (!pickup || !dropoff || !trip) return;
    const id = crypto.randomUUID();
    if (scheduledDate) {
      saveTrip({
        id,
        pickup,
        dropoff,
        rideTypeId: rideId,
        fare,
        distanceKm: trip.distanceKm,
        durationMin: trip.durationMin,
        when: scheduledDate.toISOString(),
        scheduled: true,
      });
      setNotice(
        `${ride.name} scheduled for ${scheduledDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}.`,
      );
      setWhen("now");
      setScheduledAt("");
      return;
    }
    setActive({ id, driver: randomDriver(), pin: tripPin(), driverFrom: driverStart(pickup), fare });
    setRating(0);
    setProgress(0);
    setNotice(undefined);
    setPhase("searching");
  }

  function reset() {
    setPhase("idle");
    setActive(undefined);
    setProgress(0);
  }

  function rate(stars: number) {
    setRating(stars);
    const record = trips.find((t) => t.id === active?.id);
    if (record) saveTrip({ ...record, rating: stars });
  }

  async function shareTrip() {
    if (!active || !pickup || !dropoff) return;
    const text = `I'm riding with ${active.driver.name} (${active.driver.car}, ${active.driver.plate}) from ${pickup.name} to ${dropoff.name}.`;
    try {
      if (navigator.share) await navigator.share({ title: "My trip", text });
      else {
        await navigator.clipboard.writeText(text);
        setNotice("Trip details copied to clipboard.");
      }
    } catch {
      // User dismissed the share sheet.
    }
  }

  const minSchedule = now ? toLocalInput(new Date(now.getTime() + 15 * 60_000)) : undefined;
  const scheduleInvalid = when === "later" && (!scheduledDate || (now !== null && scheduledDate.getTime() < now.getTime()));

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      {/* Map */}
      <div className="relative h-[42dvh] shrink-0 md:order-2 md:h-auto md:flex-1">
        <MapView pickup={pickup} dropoff={dropoff} driver={driverPos} onPick={handleMapPick} />
        {picking && !busy && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center px-4">
            <div className="rounded-full bg-[var(--fg)] px-4 py-2 text-sm font-medium text-[var(--bg)] shadow-lg">
              Tap the map to set your {picking === "pickup" ? "pickup" : "drop-off"}
            </div>
          </div>
        )}
      </div>

      {/* Panel */}
      <aside className="flex min-h-0 flex-1 flex-col border-[var(--border)] bg-[var(--surface)] md:order-1 md:w-[420px] md:flex-none md:border-r">
        <header className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">R</span>
            <span className="text-lg font-semibold tracking-tight">Roam</span>
          </div>
          <nav className="flex gap-1 rounded-full bg-[var(--surface-2)] p-1 text-sm" aria-label="Sections">
            {(["ride", "trips"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-current={tab === t ? "page" : undefined}
                className={`rounded-full px-3 py-1 font-medium ${tab === t ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"}`}
              >
                {t === "ride" ? "Ride" : `Trips${trips.length ? ` (${trips.length})` : ""}`}
              </button>
            ))}
          </nav>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {tab === "trips" ? (
            <TripsList trips={trips} />
          ) : busy && active ? (
            <TripStatus
              phase={phase}
              active={active}
              pickup={pickup!}
              dropoff={dropoff!}
              rideName={ride.name}
              progress={progress}
              durationMin={trip?.durationMin ?? 0}
              etaMin={ride.etaPadMin + 3}
              rating={rating}
              onRate={rate}
              onCancel={reset}
              onDone={reset}
              onShare={shareTrip}
              notice={notice}
            />
          ) : (
            <>
              <h1 className="mt-2 mb-4 text-2xl font-semibold tracking-tight">Where to?</h1>

              <div className="relative space-y-2">
                <PlaceInput
                  label="Pickup location"
                  dotClass="bg-[var(--accent)]"
                  value={pickup}
                  onChange={setPickup}
                  onPickOnMap={() => setPicking("pickup")}
                  picking={picking === "pickup"}
                />
                <PlaceInput
                  label="Drop-off location"
                  dotClass="bg-orange-500"
                  value={dropoff}
                  onChange={setDropoff}
                  onPickOnMap={() => setPicking("dropoff")}
                  picking={picking === "dropoff"}
                />
                {(pickup || dropoff) && (
                  <button
                    type="button"
                    onClick={swap}
                    aria-label="Swap pickup and drop-off"
                    className="absolute top-1/2 -right-2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm shadow-sm hover:bg-[var(--surface-2)]"
                  >
                    ⇅
                  </button>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                {(["now", "later"] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setWhen(w);
                      if (w === "later" && !scheduledAt && minSchedule) setScheduledAt(minSchedule);
                    }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium ${when === w ? "bg-[var(--fg)] text-[var(--bg)]" : "bg-[var(--surface-2)]"}`}
                  >
                    {w === "now" ? "🕒 Now" : "📅 Schedule"}
                  </button>
                ))}
              </div>
              {when === "later" && (
                <label className="mt-2 block text-sm">
                  <span className="text-[var(--muted)]">Pickup time</span>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={minSchedule}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-[var(--surface-2)] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </label>
              )}

              {notice && (
                <p role="status" className="mt-4 rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm">
                  ✅ {notice}
                </p>
              )}

              {trip ? (
                <>
                  <div className="mt-5 mb-2 flex items-baseline justify-between">
                    <h2 className="font-semibold">Choose a ride</h2>
                    <span className="text-xs text-[var(--muted)]">
                      {trip.distanceKm.toFixed(1)} km · ~{trip.durationMin} min
                    </span>
                  </div>
                  {surge > 1 && (
                    <p className="mb-2 rounded-lg bg-amber-500/15 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      Fares are higher due to increased demand (×{surge.toFixed(2)}).
                    </p>
                  )}
                  <ul className="space-y-2" role="radiogroup" aria-label="Ride options">
                    {RIDE_TYPES.map((r) => {
                      const f = fareFor(r, trip, surge);
                      const [lo, hi] = fareRange(f);
                      const selected = r.id === rideId;
                      return (
                        <li key={r.id}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setRideId(r.id)}
                            className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors ${selected ? "border-[var(--fg)]" : "border-transparent bg-[var(--surface-2)] hover:border-[var(--border)]"}`}
                          >
                            <span className="text-3xl" aria-hidden>
                              {r.icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2 font-semibold">
                                {r.name}
                                <span className="text-xs font-normal text-[var(--muted)]">👤 {r.seats}</span>
                              </span>
                              <span className="block truncate text-xs text-[var(--muted)]">
                                {r.description} · {r.etaPadMin + 3} min away
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block font-semibold">{formatMoney(f)}</span>
                              <span className="block text-[11px] text-[var(--muted)]">
                                {formatMoney(lo)}–{formatMoney(hi)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    type="button"
                    onClick={request}
                    disabled={scheduleInvalid}
                    className="mt-4 w-full rounded-xl bg-[var(--fg)] py-3.5 font-semibold text-[var(--bg)] hover:opacity-90 disabled:opacity-40"
                  >
                    {when === "later" ? `Schedule ${ride.name}` : `Request ${ride.name}`}
                  </button>
                </>
              ) : (
                <div className="mt-6 space-y-3 text-sm text-[var(--muted)]">
                  <p>Pick a place from the list, or choose “Choose on map” and tap the map.</p>
                  <ul className="space-y-2">
                    <li>🔒 Share your trip and verify your driver with a PIN</li>
                    <li>📅 Schedule rides up to 30 days ahead</li>
                    <li>✈️ Airport rides at upfront prices</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

interface TripStatusProps {
  phase: TripPhase;
  active: ActiveTrip;
  pickup: Place;
  dropoff: Place;
  rideName: string;
  progress: number;
  durationMin: number;
  etaMin: number;
  rating: number;
  onRate: (stars: number) => void;
  onCancel: () => void;
  onDone: () => void;
  onShare: () => void;
  notice?: string;
}

function TripStatus({
  phase,
  active,
  pickup,
  dropoff,
  rideName,
  progress,
  durationMin,
  etaMin,
  rating,
  onRate,
  onCancel,
  onDone,
  onShare,
  notice,
}: TripStatusProps) {
  const { driver } = active;

  if (phase === "searching") {
    return (
      <div className="mt-6 text-center">
        <div className="mx-auto mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div className="h-full w-1/3 animate-[slide_1.2s_ease-in-out_infinite] rounded-full bg-[var(--accent)]" />
        </div>
        <h1 className="text-xl font-semibold">Finding your {rideName}…</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Matching you with a nearby driver</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-6 rounded-xl bg-[var(--surface-2)] px-6 py-2.5 text-sm font-medium hover:opacity-80"
        >
          Cancel request
        </button>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <div className="mt-6 text-center">
        <div className="text-5xl" aria-hidden>
          🎉
        </div>
        <h1 className="mt-2 text-xl font-semibold">You’ve arrived</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{dropoff.name}</p>
        <p className="mt-4 text-3xl font-semibold">{formatMoney(active.fare)}</p>
        <p className="mt-6 text-sm font-medium">How was your ride with {driver.name}?</p>
        <div className="mt-2 flex justify-center gap-1" role="radiogroup" aria-label="Rate your driver">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={rating === s}
              aria-label={`${s} star${s > 1 ? "s" : ""}`}
              onClick={() => onRate(s)}
              className={`text-3xl ${s <= rating ? "text-amber-400" : "text-[var(--border)]"}`}
            >
              ★
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onDone}
          className="mt-6 w-full rounded-xl bg-[var(--fg)] py-3.5 font-semibold text-[var(--bg)] hover:opacity-90"
        >
          Done
        </button>
      </div>
    );
  }

  const arriving = phase === "arriving";
  const minsLeft = Math.max(1, Math.ceil((1 - progress) * (arriving ? etaMin : durationMin)));

  return (
    <div className="mt-3">
      <h1 className="text-xl font-semibold">
        {arriving ? `Driver arriving in ${minsLeft} min` : `Heading to ${dropoff.name}`}
      </h1>
      <p className="text-sm text-[var(--muted)]">
        {arriving ? `Meet at ${pickup.name}` : `About ${minsLeft} min to go`}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl bg-[var(--surface-2)] p-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--accent-soft)] text-lg font-semibold">
          {driver.name[0]}
        </div>
        <div className="flex-1">
          <p className="font-semibold">
            {driver.name} <span className="text-sm font-normal text-[var(--muted)]">★ {driver.rating.toFixed(2)}</span>
          </p>
          <p className="text-sm text-[var(--muted)]">{driver.car}</p>
        </div>
        <span className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono text-sm">
          {driver.plate}
        </span>
      </div>

      {arriving && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[var(--border)] px-4 py-3">
          <span className="text-sm">Share this PIN with your driver</span>
          <span className="font-mono text-xl font-semibold tracking-[0.3em]">{active.pin}</span>
        </div>
      )}

      {notice && (
        <p role="status" className="mt-3 text-sm text-[var(--muted)]">
          {notice}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onShare}
          className="rounded-xl bg-[var(--surface-2)] py-2.5 text-sm font-medium hover:opacity-80"
        >
          🔗 Share trip
        </button>
        {arriving ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-[var(--surface-2)] py-2.5 text-sm font-medium text-red-600 hover:opacity-80"
          >
            Cancel ride
          </button>
        ) : (
          <a
            href="tel:911"
            className="rounded-xl bg-red-600 py-2.5 text-center text-sm font-medium text-white hover:opacity-90"
          >
            🚨 Emergency
          </a>
        )}
      </div>
    </div>
  );
}
