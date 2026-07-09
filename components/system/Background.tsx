"use client";

import { useEffect, useRef } from "react";
import { m, useMotionValue, animate, useMotionValueEvent } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useScrollProgress } from "@/lib/useScrollProgress";

/*
 * Background — the layered environment (§9). Three parts:
 *   1. Mesh: soft radial blobs drifting over 8–15 min (CSS keyframes, GPU).
 *   2. Noise: a static 2–3% overlay so the field never looks flat/banded.
 *   3. Bloom: a transient light triggered on scroll-velocity peaks, fading
 *      within ~2s. Transform/opacity only; throttled; paused when the tab is
 *      hidden.
 *
 * Reduced motion → static gradient, no drift, no bloom (§9, §17).
 * It is fixed and sits at the very back (z 0) behind all content.
 */

// Blob tint: pale accent-tied washes, kept low-saturation so the field stays
// warm off-white. These reference --accent-* so they drift with the hue.
const BLOOM_COOLDOWN_MS = 900; // throttle: at most one bloom per ~0.9s
const BLOOM_VELOCITY_THRESHOLD = 18; // Lenis velocity magnitude to trigger

export function Background() {
  const reduced = useReducedMotion();
  const { velocity } = useScrollProgress();

  const bloom = useMotionValue(0);
  const lastBloom = useRef(0);
  const hidden = useRef(false);

  // Pause bloom work when the tab is hidden (nothing to see; save the battery).
  useEffect(() => {
    const onVis = () => {
      hidden.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Trigger a bloom pulse on scroll-velocity peaks. We animate the bloom value
  // up quickly then back to 0 over ~1.5s — a transient, not a sustained glow.
  useMotionValueEvent(velocity, "change", (v) => {
    if (reduced || hidden.current) return;
    if (Math.abs(v) < BLOOM_VELOCITY_THRESHOLD) return;
    const now = performance.now();
    if (now - lastBloom.current < BLOOM_COOLDOWN_MS) return;
    lastBloom.current = now;

    const peak = Math.min(0.16 + Math.abs(v) * 0.002, 0.32);
    animate(bloom, peak, { duration: 0.25, ease: [0.22, 1, 0.36, 1] }).then(() => {
      animate(bloom, 0, { duration: 1.5, ease: [0.25, 0.8, 0.25, 1] });
    });
  });

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        background:
          "radial-gradient(140% 120% at 50% 0%, #fbfbf9 0%, var(--bg) 55%, #f2f2ee 100%)",
      }}
    >
      {/* Mesh blobs. Animation names resolve to the keyframes in globals.css;
          the global reduced-motion rule freezes them to frame 0. */}
      <div
        className="mesh-blob"
        style={{
          top: "-15%",
          left: "-10%",
          width: "60vw",
          height: "60vw",
          background:
            "radial-gradient(circle, hsl(var(--accent-h) 46% 82% / 0.5), transparent 70%)",
          animation: reduced ? "none" : "meshDriftA 540s ease-in-out infinite",
        }}
      />
      <div
        className="mesh-blob"
        style={{
          top: "10%",
          right: "-15%",
          width: "55vw",
          height: "55vw",
          background:
            "radial-gradient(circle, hsl(calc(var(--accent-h) + 40) 40% 84% / 0.42), transparent 70%)",
          animation: reduced ? "none" : "meshDriftB 660s ease-in-out infinite",
        }}
      />
      <div
        className="mesh-blob"
        style={{
          bottom: "-20%",
          left: "20%",
          width: "50vw",
          height: "50vw",
          background:
            "radial-gradient(circle, hsl(calc(var(--accent-h) - 30) 44% 86% / 0.4), transparent 70%)",
          animation: reduced ? "none" : "meshDriftC 600s ease-in-out infinite",
        }}
      />

      {/* Bloom: a soft light that reads the current light-field position, so a
          fast scroll briefly lifts the field near where the eye already is. */}
      {!reduced && (
        <m.div
          style={{
            position: "absolute",
            inset: 0,
            opacity: bloom,
            background:
              "radial-gradient(60% 50% at var(--light-x) var(--light-y), hsl(var(--accent-h) 50% 88% / 0.9), transparent 70%)",
            willChange: "opacity",
          }}
        />
      )}

      {/* Static noise, 2–3%. Never animated. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.025,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "140px 140px",
        }}
      />
    </div>
  );
}
