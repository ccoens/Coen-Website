"use client";

import { useEffect, useRef } from "react";
import { useCapability } from "@/lib/capability";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * Echoes — the site faintly replays the ghost-trail of where your own cursor
 * moved last visit, then fades, while quietly recording this visit's path for
 * next time. A place gently haunted by your own history. Everything is in
 * localStorage; fine-pointer + motion only.
 */

const KEY = "coen.echo.v1";

export function Echoes() {
  const { finePointer, ready } = useCapability();
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ready || !finePointer || reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Prior visit's path.
    let prior: number[][] = [];
    try {
      prior = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      prior = [];
    }

    // Record this visit.
    const path: number[][] = [];
    let lastSample = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastSample < 110) return;
      lastSample = now;
      path.push([+(e.clientX / window.innerWidth).toFixed(4), +(e.clientY / window.innerHeight).toFixed(4)]);
      if (path.length > 500) path.shift();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const save = () => {
      if (path.length > 12) {
        try {
          localStorage.setItem(KEY, JSON.stringify(path));
        } catch {
          /* storage off — no-op */
        }
      }
    };
    const onHide = () => {
      if (document.hidden) save();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", save);
    const saveTimer = window.setInterval(save, 15_000);

    // Replay the prior path once, as a fading comet of light.
    let raf = 0;
    if (prior.length > 12) {
      const hue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--accent-h")) || 232;
      const w = canvas.width;
      const h = canvas.height;
      const DURATION = Math.min(prior.length * 45, 7000);
      const start = performance.now() + 900; // a beat before it begins
      const TAIL = 44;
      const replay = (t: number) => {
        const p = (t - start) / DURATION;
        if (p >= 1) {
          ctx.clearRect(0, 0, w, h);
          raf = 0;
          return;
        }
        raf = requestAnimationFrame(replay);
        ctx.clearRect(0, 0, w, h);
        if (p < 0) return;
        const head = Math.floor(p * (prior.length - 1));
        const fade = p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const tail = Math.max(1, head - TAIL);
        for (let i = tail; i <= head; i++) {
          const a = (i - tail) / TAIL;
          const [x0, y0] = prior[i - 1];
          const [x1, y1] = prior[i];
          ctx.strokeStyle = `hsla(${hue}, 55%, 72%, ${0.16 * a * fade})`;
          ctx.lineWidth = 2.2 * dpr * a;
          ctx.beginPath();
          ctx.moveTo(x0 * w, y0 * h);
          ctx.lineTo(x1 * w, y1 * h);
          ctx.stroke();
        }
        const [hx, hy] = prior[head];
        ctx.beginPath();
        ctx.arc(hx * w, hy * h, 3 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 60%, 82%, ${0.5 * fade})`;
        ctx.fill();
      };
      raf = requestAnimationFrame(replay);
    }

    return () => {
      save();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", save);
      window.clearInterval(saveTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ready, finePointer, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none", width: "100%", height: "100%" }}
    />
  );
}
