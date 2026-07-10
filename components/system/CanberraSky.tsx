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

    const draw = (t: number) => {
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

      for (const s of dome.current) {
        const bright = Math.max(0.2, 1.25 - (s.mag + 1.5) / 5);
        const rr = Math.max(0.6 * dpr, (0.5 + (2 - Math.min(s.mag, 2)) * 0.55) * dpr);
        const tw = reduced ? 1 : 0.62 + 0.38 * Math.sin(t * 0.002 + s.x * 37 + s.y * 19);
        ctx.beginPath();
        ctx.arc(s.x * size * dpr, s.y * size * dpr, rr, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(210, 62%, 88%, ${Math.min(1, bright * vis * tw)})`;
        ctx.fill();
      }
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
