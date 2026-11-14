"use client";

import { useId, useState } from "react";
import { PLACES } from "@/lib/config";
import type { Place } from "@/lib/types";

interface Props {
  label: string;
  dotClass: string;
  value?: Place;
  onChange: (place?: Place) => void;
  onPickOnMap: () => void;
  picking: boolean;
  disabled?: boolean;
}

export default function PlaceInput({ label, dotClass, value, onChange, onPickOnMap, picking, disabled }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const text = open ? query : (value?.name ?? "");
  const q = query.trim().toLowerCase();
  const matches = PLACES.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q),
  ).slice(0, 6);

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-3 focus-within:ring-2 focus-within:ring-[var(--accent)]">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
        <input
          id={id}
          value={text}
          disabled={disabled}
          placeholder={label}
          autoComplete="off"
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent py-3 text-[15px] outline-none placeholder:text-[var(--muted)] disabled:opacity-60"
        />
        {value && !disabled && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => onChange(undefined)}
            className="text-lg leading-none text-[var(--muted)] hover:text-[var(--fg)]"
          >
            ×
          </button>
        )}
      </div>
      {open && !disabled && (
        <ul className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-xl">
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPickOnMap();
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[var(--surface-2)] ${picking ? "text-[var(--accent)]" : ""}`}
            >
              <span aria-hidden>📍</span> Choose on map
            </button>
          </li>
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className="flex w-full flex-col px-3 py-2 text-left hover:bg-[var(--surface-2)]"
              >
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-xs text-[var(--muted)]">{p.area}</span>
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-[var(--muted)]">No matching places</li>}
        </ul>
      )}
    </div>
  );
}
