"use client";

import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * StarSketch — a hidden night studio. Open it (from the footer), then hold and
 * drag to lay a trail of stars that connect into your own constellation; tap to
 * drop a lone star. Everything twinkles over a deep night field, and your sky is
 * remembered on your device, so it's waiting the next time you come back. Clear
 * it, or leave with Escape.
 */

const KEY = "coen.starsketch.v1";
const MIN_GAP = 0.028; // normalised distance between stars while dragging

interface Pt {
  x: number;
  y: number;
  r: number;
  tw: number;
}
type Stroke = Pt[];

function load(): Stroke[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function save(s: Stroke[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* off */
  }
}
function star(x: number, y: number): Pt {
  return { x, y, r: 1 + Math.random() * 2, tw: Math.random() * 6.28 };
}

export function StarSketch() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);

  // Open from the footer trigger; leave on Escape.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("coen:starsketch", onOpen);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("coen:starsketch", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("scroll-locked");
    strokes.current = load();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const hue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--accent-h")) || 232;
    // Ambient background stars for atmosphere (not part of the drawing).
    const ambient = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4, tw: Math.random() * 6.28 }));

    const W = () => canvas.width;
    const H = () => canvas.height;
    const drawStroke = (s: Stroke, t: number) => {
      if (s.length > 1) {
        ctx.strokeStyle = `hsla(${hue}, 60%, 72%, 0.32)`;
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        s.forEach((p, i) => (i ? ctx.lineTo(p.x * W(), p.y * H()) : ctx.moveTo(p.x * W(), p.y * H())));
        ctx.stroke();
      }
      for (const p of s) {
        const tw = reduced ? 0.85 : 0.55 + 0.45 * Math.sin(t * 0.003 + p.tw);
        const px = p.x * W();
        const py = p.y * H();
        const g = ctx.createRadialGradient(px, py, 0, px, py, p.r * 5 * dpr);
        g.addColorStop(0, `hsla(${hue}, 70%, 86%, ${0.9 * tw})`);
        g.addColorStop(1, `hsla(${hue}, 70%, 86%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 5 * dpr, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = `hsla(210, 80%, 95%, ${tw})`;
        ctx.beginPath();
        ctx.arc(px, py, p.r * dpr, 0, 6.283);
        ctx.fill();
      }
    };

    let raf = 0;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const a of ambient) {
        const tw = reduced ? 0.4 : 0.25 + 0.35 * Math.sin(t * 0.001 + a.tw);
        ctx.fillStyle = `hsla(215, 40%, 80%, ${tw * 0.5})`;
        ctx.beginPath();
        ctx.arc(a.x * W(), a.y * H(), a.r * dpr, 0, 6.283);
        ctx.fill();
      }
      for (const s of strokes.current) drawStroke(s, t);
      if (current.current) drawStroke(current.current, t);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // Drawing.
    const norm = (e: PointerEvent) => ({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    const onDown = (e: PointerEvent) => {
      const n = norm(e);
      current.current = [star(n.x, n.y)];
    };
    const onMove = (e: PointerEvent) => {
      const s = current.current;
      if (!s) return;
      const n = norm(e);
      const last = s[s.length - 1];
      if (Math.hypot(n.x - last.x, n.y - last.y) > MIN_GAP) s.push(star(n.x, n.y));
    };
    const onUp = () => {
      if (current.current && current.current.length) {
        strokes.current = [...strokes.current, current.current];
        save(strokes.current);
      }
      current.current = null;
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      document.documentElement.classList.remove("scroll-locked");
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [open, reduced]);

  const clear = () => {
    strokes.current = [];
    current.current = null;
    save([]);
  };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 240,
            touchAction: "none",
            background: "radial-gradient(130% 100% at 50% 30%, hsl(236 40% 13%) 0%, hsl(240 44% 8%) 64%, #05060c 100%)",
          }}
        >
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "crosshair" }} />

          <div
            style={{
              position: "absolute",
              top: "var(--space-3)",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span
              className="type-caption"
              style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.16em", textTransform: "uppercase" }}
            >
              Hold &amp; drag to draw the sky
            </span>
          </div>

          <div style={{ position: "absolute", bottom: "var(--space-4)", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10 }}>
            <button type="button" onClick={clear} style={btnStyle}>
              Clear
            </button>
            <button type="button" onClick={() => setOpen(false)} style={btnStyle}>
              Leave
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.82)",
  fontSize: "var(--fs-caption)",
  cursor: "pointer",
};
