"use client";

import { createContext, useContext, useEffect, useState } from "react";

/*
 * capability.ts — device/perf gating (§6, §10). This is the load-bearing
 * performance decision in the whole build: backdrop-filter blur is the most
 * expensive thing on the page, so on low-end or touch devices we downgrade
 * glass to solid translucent surfaces and never mount the physics cursor.
 *
 * All checks are cheap and run once on mount. SSR-safe defaults assume the
 * calm, cheap path until the client can measure.
 */

export interface Capability {
  /** Fine pointer present (mouse/trackpad) — gates the physics cursor & light. */
  finePointer: boolean;
  /** Coarse pointer (touch) is the primary input. */
  coarsePointer: boolean;
  /** Device has enough headroom for live backdrop-filter blur. */
  canBlur: boolean;
  /** User asked for reduced motion. */
  reducedMotion: boolean;
  /** Resolved on the client (false during SSR / first paint). */
  ready: boolean;
}

const SSR_DEFAULT: Capability = {
  finePointer: false,
  coarsePointer: false,
  canBlur: false,
  reducedMotion: true,
  ready: false,
};

function measure(): Capability {
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // deviceMemory is a non-standard but widely supported hint (Chromium). Treat
  // its absence conservatively but not punitively — Safari/Firefox omit it.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const enoughMemory = mem === undefined ? true : mem >= 4;

  const cores = navigator.hardwareConcurrency ?? 4;
  const enoughCores = cores >= 4;

  // Blur is allowed only on a device that is plausibly a laptop/desktop with a
  // fine pointer and adequate resources. Touch phones fall back to solid glass.
  const canBlur = finePointer && enoughMemory && enoughCores && !reducedMotion;

  return {
    finePointer,
    coarsePointer,
    canBlur,
    reducedMotion,
    ready: true,
  };
}

/*
 * One measurement is shared through context so dozens of Glass surfaces don't
 * each re-run matchMedia. AppShell provides it; consumers read it.
 */
export const CapabilityContext = createContext<Capability | null>(null);

/*
 * useMeasuredCapability — resolves once on mount and reacts to reduced-motion
 * changes (the only signal that realistically toggles mid-session). Used by the
 * provider (AppShell).
 */
export function useMeasuredCapability(): Capability {
  const [cap, setCap] = useState<Capability>(SSR_DEFAULT);

  useEffect(() => {
    setCap(measure());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setCap(measure());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return cap;
}

/*
 * useCapability — the consumer hook. Reads the shared context when present;
 * falls back to the calm SSR default otherwise (e.g. isolated tests).
 */
export function useCapability(): Capability {
  return useContext(CapabilityContext) ?? SSR_DEFAULT;
}
