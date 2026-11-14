"use client";

import { RIDE_TYPES } from "@/lib/config";
import { formatMoney } from "@/lib/pricing";
import { removeTrip, useNow } from "@/lib/stores";
import type { TripRecord } from "@/lib/types";

export default function TripsList({ trips }: { trips: TripRecord[] }) {
  const now = useNow();
  if (trips.length === 0) {
    return (
      <div className="mt-10 text-center text-sm text-[var(--muted)]">
        <p className="text-4xl" aria-hidden>
          🧾
        </p>
        <p className="mt-2">No trips yet. Your completed and scheduled rides will show up here.</p>
      </div>
    );
  }

  const upcoming = trips.filter((t) => t.scheduled && now !== null && new Date(t.when).getTime() > now.getTime());
  const past = trips.filter((t) => !upcoming.includes(t));

  return (
    <div className="mt-2 space-y-6">
      {upcoming.length > 0 && <Section title="Upcoming" trips={upcoming} cancellable />}
      {past.length > 0 && <Section title="Past" trips={past} />}
    </div>
  );
}

function Section({ title, trips, cancellable }: { title: string; trips: TripRecord[]; cancellable?: boolean }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-[var(--muted)] uppercase">{title}</h2>
      <ul className="space-y-2">
        {trips.map((t) => {
          const ride = RIDE_TYPES.find((r) => r.id === t.rideTypeId);
          return (
            <li key={t.id} className="rounded-xl bg-[var(--surface-2)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.dropoff.name}</p>
                  <p className="truncate text-xs text-[var(--muted)]">from {t.pickup.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {new Date(t.when).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                    {ride?.name ?? t.rideTypeId}
                    {t.driver && ` · ${t.driver.name}`}
                    {t.rating ? ` · ${"★".repeat(t.rating)}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">{formatMoney(t.fare)}</p>
                  {cancellable && (
                    <button
                      type="button"
                      onClick={() => removeTrip(t.id)}
                      className="mt-1 text-xs font-medium text-red-600 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
