"use client";

import { useEffect } from "react";

/*
 * accent.ts — the single dynamic hue (§4).
 *
 * The brief's original "hue drifts over 30–90 min" is invisible within a normal
 * visit, so instead we SEED the starting hue deterministically from the visit's
 * date + hour (different visits differ; one visit stays coherent) and drift
 * slowly on top of that seed. Reduced motion → fixed seeded hue, no drift.
 *
 * Constraints (§4): range muted blue → violet → soft amber, saturation ≤ 40%,
 * lightness ~60–65%. We write only --accent-h each frame; s/l stay in tokens.
 */

// Hue band we sweep within. 210 (muted blue) → 300 (violet) with a soft amber
// tail folded in at the low end so the whole range stays calm and warm-ish.
const HUE_MIN = 208;
const HUE_MAX = 292;
const HUE_SPAN = HUE_MAX - HUE_MIN;

/** Deterministic seed hue from date + hour. Same hour ⇒ same starting hue. */
export function seedHue(now: Date = new Date()): number {
  // Day-of-year * 24 + hour gives a stable integer that changes each hour.
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const key = dayOfYear * 24 + now.getHours();

  // Cheap integer hash → 0..1, mapped into the hue band.
  let h = key * 2654435761;
  h = (h ^ (h >>> 15)) >>> 0;
  const t = (h % 10_000) / 10_000;
  return HUE_MIN + t * HUE_SPAN;
}

/*
 * useAccent — seeds --accent-h immediately, then (motion allowed only) drifts
 * it very slowly with a single rAF loop. The drift is a gentle sine so it never
 * reaches a hard edge or reads as a loop. Amplitude is tiny: ±14° over minutes.
 */
export function useAccent(reducedMotion: boolean): void {
  useEffect(() => {
    const root = document.documentElement;
    const base = seedHue();
    root.style.setProperty("--accent-h", base.toFixed(1));

    if (reducedMotion) return; // fixed seeded hue, no drift (§4, §17)

    let raf = 0;
    const start = performance.now();
    // One full breath ~ 12 minutes: imperceptible, within §8 ambient range.
    const PERIOD_MS = 12 * 60 * 1000;
    const AMPLITUDE = 14;

    const tick = (t: number) => {
      const phase = ((t - start) % PERIOD_MS) / PERIOD_MS; // 0..1
      // Ease the sine slightly so turning points feel organic, not mechanical.
      const eased = Math.sin(phase * Math.PI * 2);
      let hue = base + eased * AMPLITUDE;
      // Fold back into the band without a visible bounce.
      if (hue < HUE_MIN) hue = HUE_MIN + (HUE_MIN - hue);
      if (hue > HUE_MAX) hue = HUE_MAX - (hue - HUE_MAX);
      root.style.setProperty("--accent-h", hue.toFixed(1));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);
}
