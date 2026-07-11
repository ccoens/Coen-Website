"use client";

import { useEffect, useState } from "react";
import { canberraNow, BEDTIME, WAKE } from "./time";

/*
 * vitality.ts — the site's circadian pulse. It follows Coen's real body clock in
 * Canberra: ~1 while he's awake, easing down to a low floor while he sleeps
 * (11pm→7:15am), with soft ramps across waking and bedtime. Published as the
 * --vitality / --rest CSS variables and consumed by the shader, the rest veil,
 * and anything that should quieten when he sleeps.
 */

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function smooth(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const FLOOR = 0.14; // never fully dead — a slow sleeping breath

/** 0.14 (deep sleep) → 1 (fully awake), smooth across the day. */
export function computeVitality(now = canberraNow()): number {
  const h = now.hour;
  if (h >= WAKE && h < BEDTIME) {
    const waking = smooth(WAKE - 0.5, WAKE + 1.25, h); // rise after 7:15
    const toBed = 1 - smooth(BEDTIME - 1.25, BEDTIME, h); // fall before 11
    return FLOOR + (1 - FLOOR) * Math.min(waking, toBed);
  }
  return FLOOR; // asleep
}

export function useVitality(): number {
  const [v, setV] = useState(1);
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const val = computeVitality();
      setV(val);
      root.style.setProperty("--vitality", val.toFixed(3));
      root.style.setProperty("--rest", (1 - val).toFixed(3));
    };
    apply();
    const id = window.setInterval(apply, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return v;
}
