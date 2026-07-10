"use client";

import { useEffect, useRef } from "react";
import { canberraStarDome, type ProjectedStar } from "@/lib/skyfield";
import { canberraNow } from "@/lib/time";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * CanberraSky — a live planisphere of the real sky over Canberra right now:
 * zenith at the centre, horizon at the rim, the bright stars where they actually
 * are this minute. It fades in as Canberra darkens (bright at night, a whisper by
 * day) so the little disc beside the clock always matches the sky above Coen.
 * Twinkles gently; static (but still correct) under reduced motion.
 */
export function CanberraSky({ size = 60 }: { size?: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLCanvasElement>(null);
  const dome = useRef<ProjectedStar[]>([]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const R = (size / 2) * dpr;
    const C = (size / 2) * dpr;

    const compute = () => {
      dome.current = canberraStarDome();
    };
    compute();
    const recompute = window.setInterval(compute, 60_000);

    // Shooting stars: rare meteors that streak across the dome at night.
    interface Meteor {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
    }
    const meteors: Meteor[] = [];
    let lastT = 0;

    const draw = (t: number) => {
      const dt = lastT ? Math.min(t - lastT, 60) : 16;
      lastT = t;
      const daylight = canberraNow().daylight;
      const vis = Math.max(0.12, 1 - daylight); // fade with Canberra's darkness
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Night disc + horizon rim.
      ctx.beginPath();
      ctx.arc(C, C, R, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(232, 42%, 12%, ${0.55 * vis})`;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `hsla(220, 30%, 60%, ${0.28 * vis})`;
      ctx.stroke();

      // Keep stars + meteors inside the dome.
      ctx.save();
      ctx.beginPath();
      ctx.arc(C, C, R, 0, Math.PI * 2);
      ctx.clip();

      for (const s of dome.current) {
        const bright = Math.max(0.2, 1.25 - (s.mag + 1.5) / 5);
        const rr = Math.max(0.6 * dpr, (0.5 + (2 - Math.min(s.mag, 2)) * 0.55) * dpr);
        const tw = reduced ? 1 : 0.62 + 0.38 * Math.sin(t * 0.002 + s.x * 37 + s.y * 19);
        ctx.beginPath();
        ctx.arc(s.x * size * dpr, s.y * size * dpr, rr, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(210, 62%, 88%, ${Math.min(1, bright * vis * tw)})`;
        ctx.fill();
      }

      // Spawn + advance meteors (night only, motion allowed).
      if (!reduced && vis > 0.45) {
        if (meteors.length === 0 && Math.random() < dt * 0.0009) {
          const a = Math.random() * Math.PI * 2;
          const speed = (R * 1.6) / 700; // cross the disc in ~0.7s (px/ms)
          const dir = a + Math.PI + (Math.random() - 0.5); // roughly across
          meteors.push({
            x: C + Math.cos(a) * R * 0.85,
            y: C + Math.sin(a) * R * 0.85,
            vx: Math.cos(dir) * speed,
            vy: Math.sin(dir) * speed,
            life: 0,
            max: 700,
          });
        }
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life += dt;
        const k = 1 - m.life / m.max; // fade out
        const tailX = m.x - m.vx * 90;
        const tailY = m.y - m.vy * 90;
        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `hsla(205, 80%, 92%, ${0.9 * k * vis})`);
        grad.addColorStop(1, "hsla(205, 80%, 92%, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4 * dpr;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        const dist = Math.hypot(m.x - C, m.y - C);
        if (m.life > m.max || dist > R * 1.1) meteors.splice(i, 1);
      }

      ctx.restore();
    };

    let raf = 0;
    const loop = (t: number) => {
      if (document.hidden) {
        raf = 0;
        return;
      }
      draw(t);
      if (!reduced) raf = requestAnimationFrame(loop);
    };
    draw(0);
    if (!reduced) raf = requestAnimationFrame(loop);
    const onVis = () => {
      if (!document.hidden && !reduced && raf === 0) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(recompute);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduced, size]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ width: size, height: size, display: "block", flexShrink: 0, borderRadius: "50%" }}
    />
  );
}
