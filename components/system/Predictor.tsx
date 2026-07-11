"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCapability } from "@/lib/capability";

/*
 * Predictor — anticipates where the cursor is headed. It fits a smoothed
 * velocity from the last ~140ms of movement, then scores every on-screen link by
 * how tightly the cursor is arrowing toward it (a narrow cone), how near it is,
 * and whether it clearly beats the runner-up. The winner lights up and its route
 * is prefetched, so by the time you arrive the page is already there. Hysteresis
 * (acquire at a tight angle, hold at a looser one) keeps it from flickering.
 *
 * Fine-pointer only. The glow is a class; motion is dropped under reduced motion
 * via CSS — the prefetch still runs, so it stays useful, just invisible.
 */

const ACQUIRE_ALIGN = 0.9; // ~25° cone to lock on
const HOLD_ALIGN = 0.78; // wider cone to keep a lock
const MIN_SPEED = 0.3; // px/ms — must be moving with intent
const MIN_DIST = 60; // already on it below this

export function Predictor() {
  const router = useRouter();
  const { finePointer, ready } = useCapability();

  useEffect(() => {
    if (!ready || !finePointer) return;

    const samples: { x: number; y: number; t: number }[] = [];
    let candidates: HTMLElement[] = [];
    let current: HTMLElement | null = null;
    const prefetched = new Set<string>();

    const refresh = () => {
      candidates = (Array.from(
        document.querySelectorAll<HTMLElement>('a[href^="/"]:not([data-no-predict]), [data-predict]'),
      )).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
      });
    };
    refresh();
    const refreshTimer = window.setInterval(refresh, 400);

    const onMove = (e: PointerEvent) => {
      samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (samples.length > 12) samples.shift();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", refresh, { passive: true });

    const setPrediction = (el: HTMLElement | null) => {
      if (el === current) return;
      current?.classList.remove("is-predicted");
      current = el;
      if (el) {
        el.classList.add("is-predicted");
        const href = el.getAttribute("href");
        if (href && href.startsWith("/") && !prefetched.has(href)) {
          prefetched.add(href);
          try {
            router.prefetch(href);
          } catch {
            /* prefetch is best-effort */
          }
        }
      }
    };

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      while (samples.length > 2 && now - samples[0].t > 140) samples.shift();
      if (samples.length < 2) {
        setPrediction(null);
        return;
      }
      const a = samples[0];
      const b = samples[samples.length - 1];
      const dt = Math.max(b.t - a.t, 1);
      const vx = (b.x - a.x) / dt;
      const vy = (b.y - a.y) / dt;
      const speed = Math.hypot(vx, vy);
      if (speed < MIN_SPEED || now - b.t > 90) {
        setPrediction(null);
        return;
      }
      const vhx = vx / speed;
      const vhy = vy / speed;

      let best: HTMLElement | null = null;
      let bestScore = 0;
      let second = 0;
      let currentAlign = 0;

      for (const el of candidates) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - b.x;
        const dy = cy - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MIN_DIST) continue;
        const align = (dx * vhx + dy * vhy) / dist;
        if (el === current) currentAlign = align;
        if (align < HOLD_ALIGN) continue;
        const score = Math.pow(align, 4) * (260 / (dist + 260));
        if (score > bestScore) {
          second = bestScore;
          bestScore = score;
          best = el;
        } else if (score > second) {
          second = score;
        }
      }

      // Acquire a new target only on a tight cone + a clear margin over the
      // runner-up; otherwise hold the current one while it still roughly aligns.
      if (best && bestScore > second * 1.25) {
        const r = best.getBoundingClientRect();
        const dx = r.left + r.width / 2 - b.x;
        const dy = r.top + r.height / 2 - b.y;
        const align = (dx * vhx + dy * vhy) / Math.hypot(dx, dy);
        if (align >= ACQUIRE_ALIGN) {
          setPrediction(best);
          return;
        }
      }
      if (current && currentAlign >= HOLD_ALIGN) return; // keep the lock
      setPrediction(null);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(refreshTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", refresh);
      current?.classList.remove("is-predicted");
    };
  }, [ready, finePointer, router]);

  return null;
}
