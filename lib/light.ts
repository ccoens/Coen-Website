"use client";

import { useEffect, type RefObject } from "react";

/*
 * light.ts — the shared light-field loop (§7).
 *
 * A soft directional light driven by cursor velocity + scroll velocity, never
 * neon. ONE requestAnimationFrame loop writes --light-x / --light-y /
 * --light-intensity on <html>; glass specular gradients, the hero sheen and the
 * background bloom all read these. Consumers only ever use them inside
 * transforms/gradients/opacity, never layout-affecting properties.
 *
 * Desktop (fine pointer): light tracks the cursor, intensity from cursor speed.
 * Touch: no pointer, so light drifts from scroll velocity alone.
 * Reduced motion: loop never starts; tokens.css holds a calm static value.
 */

interface LightFieldOptions {
  enabled: boolean; // false → do nothing (reduced motion / not ready)
  finePointer: boolean; // true → follow cursor; false → follow scroll only
  /** Live scroll velocity in px/frame-ish units, updated by SmoothScroll. */
  scrollVelocityRef: RefObject<number>;
}

export function useLightField({
  enabled,
  finePointer,
  scrollVelocityRef,
}: LightFieldOptions): void {
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;

    // Target and smoothed current position, in viewport fractions (0..1).
    let targetX = 0.5;
    let targetY = 0.38;
    let curX = 0.5;
    let curY = 0.38;
    let curIntensity = 0.45;

    // Cursor velocity, derived from successive pointer samples.
    let lastPointer = { x: 0, y: 0, t: 0 };
    let pointerSpeed = 0;

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      targetX = e.clientX / window.innerWidth;
      targetY = e.clientY / window.innerHeight;
      const dt = Math.max(now - lastPointer.t, 1);
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      // px/ms → a small unitless speed; clamped later.
      pointerSpeed = Math.min(Math.hypot(dx, dy) / dt, 3);
      lastPointer = { x: e.clientX, y: e.clientY, t: now };
    };

    if (finePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    let raf = 0;
    const tick = () => {
      // On touch the horizontal light sits centred; vertical follows scroll.
      if (!finePointer) {
        const sv = scrollVelocityRef.current ?? 0;
        targetY = 0.5 + Math.max(Math.min(sv * 0.0006, 0.18), -0.18);
        targetX = 0.5;
      }

      // Critically-damped-ish smoothing: current eases toward target. The 0.08
      // factor is the whole "calm" feel — higher would read as snappy.
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;

      // Intensity blends a calm floor with velocity energy, then decays.
      const scrollEnergy = Math.min(
        Math.abs(scrollVelocityRef.current ?? 0) * 0.0012,
        0.5,
      );
      const energy = Math.min(pointerSpeed * 0.18 + scrollEnergy, 0.55);
      const targetIntensity = 0.4 + energy;
      curIntensity += (targetIntensity - curIntensity) * 0.06;

      // Velocity decays each frame so the light settles when input stops.
      pointerSpeed *= 0.9;

      root.style.setProperty("--light-x", (curX * 100).toFixed(2) + "%");
      root.style.setProperty("--light-y", (curY * 100).toFixed(2) + "%");
      root.style.setProperty("--light-intensity", curIntensity.toFixed(3));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (finePointer) window.removeEventListener("pointermove", onPointerMove);
    };
  }, [enabled, finePointer, scrollVelocityRef]);
}
