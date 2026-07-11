"use client";

import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { coenAsleep } from "@/lib/time";
import { dreamLine } from "@/lib/dream";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * Dream — the site's subconscious. It only stirs while Coen is actually asleep
 * in Canberra (or on the #dream preview hash). A quiet invitation appears; step
 * in and the site drifts into a generative night: its own content — what he
 * builds, moments from the journal, the places he's been — recombines into
 * surreal, never-repeating dream-lines over drifting stars. Click to wake.
 *
 * A website with a subconscious, visible only while its maker sleeps.
 */

interface DreamText {
  id: number;
  text: string;
  x: number;
  y: number;
}

export function Dream() {
  const reduced = useReducedMotion();
  const [asleep, setAsleep] = useState(false);
  const [preview, setPreview] = useState(false);
  const [open, setOpen] = useState(false);
  const [invite, setInvite] = useState(false);
  const [lines, setLines] = useState<DreamText[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Is Coen asleep right now? (re-check each minute) + #dream preview.
  useEffect(() => {
    const check = () => setAsleep(coenAsleep());
    check();
    const id = window.setInterval(check, 60_000);
    const onHash = () => setPreview(location.hash === "#dream");
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const available = asleep || preview;

  useEffect(() => {
    if (preview) setOpen(true);
  }, [preview]);

  useEffect(() => {
    if (!available) {
      setInvite(false);
      return;
    }
    const t = window.setTimeout(() => setInvite(true), 3500);
    return () => window.clearTimeout(t);
  }, [available]);

  // Lock the page + Escape to wake, while dreaming.
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("scroll-locked");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("scroll-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Spawn drifting dream-lines.
  useEffect(() => {
    if (!open) {
      setLines([]);
      return;
    }
    let counter = 0;
    const spawn = () => {
      const id = counter++;
      const seed = (Date.now() ^ (id * 2654435761)) >>> 0;
      const text = dreamLine(seed);
      const x = 6 + Math.random() * 48;
      const y = 14 + Math.random() * 64;
      setLines((prev) => [...prev.slice(-4), { id, text, x, y }]);
      if (!reduced) {
        window.setTimeout(() => setLines((prev) => prev.filter((l) => l.id !== id)), 11_000);
      }
    };
    spawn();
    if (reduced) {
      spawn();
      spawn();
      return;
    }
    const iv = window.setInterval(spawn, 3200);
    return () => window.clearInterval(iv);
  }, [open, reduced]);

  // Star + colour-cloud field.
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const hue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--accent-h")) || 232;
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.8,
      tw: Math.random() * 6.28,
      vx: (Math.random() - 0.5) * 0.008,
      vy: (Math.random() - 0.5) * 0.008,
    }));
    const blobs = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.22 + Math.random() * 0.24,
      h: hue + (i - 2) * 22,
      ph: Math.random() * 6.28,
    }));
    let raf = 0;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const b of blobs) {
        const bx = (b.x + 0.03 * Math.sin(t * 0.0001 + b.ph)) * canvas.width;
        const by = (b.y + 0.03 * Math.cos(t * 0.00008 + b.ph)) * canvas.height;
        const rad = b.r * canvas.width;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
        g.addColorStop(0, `hsla(${b.h}, 55%, 46%, 0.10)`);
        g.addColorStop(1, `hsla(${b.h}, 55%, 46%, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      for (const s of stars) {
        if (!reduced) {
          s.x += s.vx * 0.001;
          s.y += s.vy * 0.001;
          if (s.x < 0) s.x += 1;
          if (s.x > 1) s.x -= 1;
          if (s.y < 0) s.y += 1;
          if (s.y > 1) s.y -= 1;
        }
        const tw = reduced ? 0.8 : 0.5 + 0.5 * Math.sin(t * 0.001 + s.tw);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r * dpr, 0, 6.283);
        ctx.fillStyle = `hsla(210, 60%, 86%, ${0.22 + tw * 0.5})`;
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw(0);
    if (!reduced) raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [open, reduced]);

  return (
    <>
      <AnimatePresence>
        {available && invite && !open && (
          <m.button
            type="button"
            onClick={() => setOpen(true)}
            data-cursor="interactive"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: reduced ? 0.2 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              left: "50%",
              bottom: "calc(var(--space-4))",
              x: "-50%",
              zIndex: 92,
              padding: "9px 18px",
              borderRadius: "999px",
              border: "1px solid hsl(var(--accent-h) var(--accent-s) 60% / 0.4)",
              background: "var(--surface-solid)",
              color: "var(--text-secondary)",
              fontSize: "var(--fs-caption)",
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: "var(--accent)" }}>✶</span> Coen is asleep — the site is
            dreaming
          </m.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <m.div
            aria-hidden
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.2 : 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 260,
              cursor: "pointer",
              background:
                "radial-gradient(130% 100% at 50% 35%, hsl(238 40% 14%) 0%, hsl(242 44% 8%) 62%, #05060c 100%)",
            }}
          >
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

            <AnimatePresence>
              {lines.map((l) => (
                <m.p
                  key={l.id}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(6px)" }}
                  animate={reduced ? { opacity: 0.86 } : { opacity: 0.86, y: 0, filter: "blur(0px)" }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -18, filter: "blur(6px)" }}
                  transition={{ duration: reduced ? 0.3 : 2.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "absolute",
                    left: `${l.x}%`,
                    top: `${l.y}%`,
                    maxWidth: "42ch",
                    margin: 0,
                    fontSize: "clamp(18px, 2.4vw, 34px)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    lineHeight: 1.35,
                    color: "rgba(233,236,248,0.9)",
                    textShadow: "0 2px 30px rgba(0,0,0,0.6)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {l.text}
                </m.p>
              ))}
            </AnimatePresence>

            <m.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.5, duration: 1.5 }}
              style={{
                position: "absolute",
                bottom: "var(--space-5)",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "var(--fs-caption)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Click to wake
            </m.span>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
