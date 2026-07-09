"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  ScrollContext,
  useScrollValues,
} from "@/lib/useScrollProgress";

/*
 * SmoothScroll — Lenis smoothing + the scroll-progress/velocity context (§9).
 *
 * The whole "gliding over polished stone" feel depends on this. Lenis owns the
 * scroll; a single rAF loop drives it and publishes progress + velocity into
 * the shared context. Reduced motion disables smoothing entirely and falls back
 * to a passive native-scroll listener so progress-driven UI still works.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  // Nav / anchor navigation routes through here so section jumps use the same
  // smoothing as the wheel — never a second, competing smooth-scroll.
  const scrollTo = useCallback((target: string | number, offset = -80) => {
    const dest =
      typeof target === "string" ? (target.startsWith("#") ? target : `#${target}`) : target;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(dest, { offset });
      return;
    }
    // Reduced-motion path: no Lenis. Resolve the element and jump instantly.
    if (typeof dest === "number") {
      window.scrollTo({ top: dest + offset, behavior: "auto" });
    } else {
      const el = document.querySelector(dest);
      if (el) {
        const top =
          el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: "auto" });
      }
    }
  }, []);

  const values = useScrollValues(scrollTo);
  const { progress, velocity, scrollY, scrollVelocityRef } = values;

  useEffect(() => {
    // Reduced motion: no Lenis. Track scroll natively so morph/nav still update,
    // with velocity pinned near zero (no motion energy fed to light/bloom).
    if (reduced) {
      const onScroll = () => {
        const y = window.scrollY;
        const limit =
          document.documentElement.scrollHeight - window.innerHeight;
        scrollY.set(y);
        progress.set(limit > 0 ? y / limit : 0);
        velocity.set(0);
        scrollVelocityRef.current = 0;
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    // Lenis lerp 0.1 sits in the spec's 0.08–0.12 damping band. Lower = calmer.
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    lenis.on(
      "scroll",
      (e: { scroll: number; limit: number; velocity: number; progress: number }) => {
        scrollY.set(e.scroll);
        progress.set(e.progress);
        velocity.set(e.velocity);
        // Synchronous ref for the light-field loop (avoids a MV subscription).
        scrollVelocityRef.current = e.velocity;
      },
    );

    // One rAF loop drives Lenis. Nothing else in the app calls lenis.raf.
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced, progress, velocity, scrollY, scrollVelocityRef]);

  return (
    <ScrollContext.Provider value={values}>{children}</ScrollContext.Provider>
  );
}
