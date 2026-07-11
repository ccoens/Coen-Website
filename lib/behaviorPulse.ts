"use client";

/*
 * behaviorPulse.ts — a tiny always-on read of *how* you move the cursor. It keeps
 * smoothed speed + jitter (direction change) and turns them into an inferred
 * state: still, calm, hesitant, hurried, restless. The dossier reads this to tell
 * you what your own hand is giving away. Module singleton, one passive listener.
 */

let started = false;
let speedEMA = 0;
let jitterEMA = 0;
let lastMove = 0;
let last: { x: number; y: number; t: number } | null = null;
let lastAngle = 0;

function onMove(e: PointerEvent) {
  const now = performance.now();
  if (last) {
    const dt = Math.max(now - last.t, 1);
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    const sp = Math.hypot(dx, dy) / dt; // px/ms
    speedEMA += (sp - speedEMA) * 0.12;
    if (sp > 0.02) {
      const ang = Math.atan2(dy, dx);
      let da = Math.abs(ang - lastAngle);
      if (da > Math.PI) da = 2 * Math.PI - da;
      jitterEMA += (da - jitterEMA) * 0.12;
      lastAngle = ang;
    }
  }
  last = { x: e.clientX, y: e.clientY, t: now };
  lastMove = now;
}

export function startPulse(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("pointermove", onMove, { passive: true });
}

export interface Mood {
  label: string;
  energy: number; // 0 calm → 1 charged
}

export function getMood(): Mood {
  const idle = performance.now() - lastMove > 4000;
  if (idle || speedEMA < 0.04) return { label: "still — unhurried, taking it in", energy: 0.15 };
  if (speedEMA > 0.9 && jitterEMA > 0.9) return { label: "restless — darting about", energy: 0.92 };
  if (speedEMA > 0.8) return { label: "moving fast — somewhere to be?", energy: 0.8 };
  if (jitterEMA > 1.1) return { label: "hesitant — weighing something up", energy: 0.5 };
  return { label: "calm and deliberate", energy: 0.4 };
}
