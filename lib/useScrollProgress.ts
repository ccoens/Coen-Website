"use client";

import { createContext, useContext, useMemo, useRef } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";

/*
 * useScrollProgress.ts — the scroll context contract (§9).
 *
 * SmoothScroll owns Lenis and publishes here. Everything downstream (hero morph,
 * nav opacity, light field, bloom) reads from ONE source of truth so nothing
 * runs its own scroll listener.
 *
 * We expose MotionValues (subscribe without re-rendering) plus a plain ref for
 * velocity — the light-field rAF loop wants a cheap synchronous read, not a
 * MotionValue subscription.
 */

export interface ScrollContextValue {
  /** 0 at top of document, 1 at the bottom. */
  progress: MotionValue<number>;
  /** Signed scroll velocity (Lenis units); ~0 when settled. */
  velocity: MotionValue<number>;
  /** Same velocity as a synchronous ref, for the light-field loop. */
  scrollVelocityRef: React.RefObject<number>;
  /** Absolute scroll offset in px. */
  scrollY: MotionValue<number>;
  /** Smoothly scroll to an element id or a pixel offset (uses Lenis when on). */
  scrollTo: (target: string | number, offset?: number) => void;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

export { ScrollContext };

/*
 * useScrollValues — creates the shared MotionValues + velocity ref once.
 * Called only by SmoothScroll, which feeds them from Lenis and provides them.
 */
export function useScrollValues(
  scrollTo: (target: string | number, offset?: number) => void,
): ScrollContextValue {
  const progress = useMotionValue(0);
  const velocity = useMotionValue(0);
  const scrollY = useMotionValue(0);
  const scrollVelocityRef = useRef(0);

  return useMemo(
    () => ({ progress, velocity, scrollY, scrollVelocityRef, scrollTo }),
    [progress, velocity, scrollY, scrollTo],
  );
}

/*
 * useScrollProgress — the consumer hook. Safe to call outside the provider
 * (returns inert MotionValues) so components can mount during SSR / tests
 * without a provider and simply see progress 0.
 */
export function useScrollProgress(): ScrollContextValue {
  const ctx = useContext(ScrollContext);
  // Stable inert fallback for SSR / provider-less rendering.
  const fallbackProgress = useMotionValue(0);
  const fallbackVelocity = useMotionValue(0);
  const fallbackScrollY = useMotionValue(0);
  const fallbackRef = useRef(0);

  return (
    ctx ?? {
      progress: fallbackProgress,
      velocity: fallbackVelocity,
      scrollY: fallbackScrollY,
      scrollVelocityRef: fallbackRef,
      scrollTo: () => {},
    }
  );
}
