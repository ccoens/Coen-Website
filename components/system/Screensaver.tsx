"use client";

import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * Screensaver — after a stretch of inactivity the site drifts into an ambient
 * night field: slow accent stars over a deep veil, the COEN mark breathing
 * faintly at centre. Any input dismisses it instantly. Never auto-triggers under
 * reduced motion. Decorative and fully escapable (any key wakes it), so it stays
 * out of the accessibility tree.
 */

const IDLE_MS = 45_000;

export function Screensaver() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Idle detection.
  useEffect(() => {
    if (reduced) return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setActive(true), IDLE_MS);
    };
    const wake = () => {
      setActive((a) => {
        if (a) return false;
        return a;
      });
      arm();
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    arm();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [reduced]);

  // Particle field, only while active.
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-h")
      .trim();
    const hue = parseFloat(accent) || 232;

    const N = 70;
    const stars = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
      tw: Math.random() * Math.PI * 2,
    }));

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

    let raf = 0;
    const loop = (t: number) => {
      const dt = lastT ? Math.min(t - lastT, 60) : 16;
      lastT = t;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.x += s.vx * 0.001;
        s.y += s.vy * 0.001;
        if (s.x < 0) s.x += 1;
        if (s.x > 1) s.x -= 1;
        if (s.y < 0) s.y += 1;
        if (s.y > 1) s.y -= 1;
        const tw = 0.5 + 0.5 * Math.sin(t * 0.001 + s.tw);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 55%, 78%, ${0.25 + tw * 0.5})`;
        ctx.fill();
      }

      // Shooting stars streak diagonally across the field now and then.
      if (meteors.length < 2 && Math.random() < dt * 0.0012) {
        const speed = (canvas.width * 0.9) / 900; // cross in ~0.9s (px/ms)
        const ang = Math.PI * (0.15 + Math.random() * 0.2); // shallow downward
        meteors.push({
          x: Math.random() * canvas.width * 0.6,
          y: Math.random() * canvas.height * 0.4,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          life: 0,
          max: 1100,
        });
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life += dt;
        const k = Math.max(0, 1 - m.life / m.max);
        const tailX = m.x - m.vx * 120;
        const tailY = m.y - m.vy * 120;
        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `hsla(210, 70%, 92%, ${0.85 * k})`);
        grad.addColorStop(1, "hsla(210, 70%, 92%, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6 * dpr;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        if (m.life > m.max || m.x > canvas.width + 200 || m.y > canvas.height + 200)
          meteors.splice(i, 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <m.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            pointerEvents: "none",
            background:
              "radial-gradient(120% 100% at 50% 40%, hsl(232 34% 16%) 0%, hsl(240 40% 9%) 70%, #06070d 100%)",
          }}
        >
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          <m.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <span
              style={{
                fontSize: "clamp(48px, 10vw, 120px)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: "rgba(255,255,255,0.9)",
                animation: "screensaver-breathe 6s ease-in-out infinite",
              }}
            >
              COEN
            </span>
            <span
              style={{
                fontSize: "var(--fs-caption)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Move to wake
            </span>
          </m.div>
          <style>{
            "@keyframes screensaver-breathe{0%,100%{opacity:0.75;transform:translateY(0)}50%{opacity:1;transform:translateY(-6px)}}"
          }</style>
        </m.div>
      )}
    </AnimatePresence>
  );
}
