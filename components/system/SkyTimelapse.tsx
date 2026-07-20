"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { visitorSky } from "@/lib/sky";
import { seedHue } from "@/lib/accent";
import { canberraNow, coenAsleep } from "@/lib/time";
import { canberraStarDome } from "@/lib/skyfield";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * SkyTimelapse — a day in the life of the site. Scrub (or play) across 24 hours
 * and watch everything the site quietly computes shift together: your local sky
 * from dawn to night, the accent hue, the real Canberra stars coming out, and
 * the moment Coen's asleep and it starts to dream. It makes the invisible
 * machinery visible in one gesture.
 */

// RGB key palettes for the preview sky.
const DAY_TOP = [92, 150, 214];
const DAY_BOT = [156, 194, 226];
const NIGHT_TOP = [20, 24, 52];
const NIGHT_BOT = [10, 12, 30];
const GOLD_TOP = [212, 120, 72];
const GOLD_BOT = [236, 176, 112];

function mix(a: number[], b: number[], t: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}
const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

export function SkyTimelapse() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours() + new Date().getMinutes() / 60);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const domeRef = useRef<ReturnType<typeof canberraStarDome>>([]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("coen:timelapse", onOpen);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("coen:timelapse", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) document.documentElement.classList.add("scroll-locked");
    return () => document.documentElement.classList.remove("scroll-locked");
  }, [open]);

  // The virtual moment being previewed: today, at the scrubbed hour.
  const virtual = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getTime() + hour * 3600_000);
  }, [hour]);

  const sky = useMemo(() => visitorSky(virtual), [virtual]);
  const cbr = useMemo(() => canberraNow(virtual), [virtual]);
  const asleep = coenAsleep(cbr);
  const accentHue = useMemo(() => Math.round(seedHue(virtual)), [virtual]);

  // Recompute the Canberra star positions in ~15-minute steps.
  const domeKey = Math.round(hour * 4);
  useEffect(() => {
    domeRef.current = canberraStarDome(virtual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domeKey, open]);

  // Auto-play the day.
  useEffect(() => {
    if (!open || !playing || reduced) return;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      setHour((h) => (h + dt * 2) % 24); // ~2 hours per second
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, playing, reduced]);

  // Star field for the previewed Canberra moment (opacity = Canberra darkness).
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    let raf = 0;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const darkness = Math.max(0, 1 - cbr.daylight);
      for (const s of domeRef.current) {
        const bright = Math.max(0.2, 1.25 - (s.mag + 1.5) / 5);
        const tw = reduced ? 0.85 : 0.6 + 0.4 * Math.sin(t * 0.002 + s.x * 40);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, Math.max(0.7 * dpr, (2 - Math.min(s.mag, 2)) * dpr), 0, 6.283);
        ctx.fillStyle = `hsla(210, 60%, 88%, ${Math.min(1, bright * darkness * tw)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [open, cbr.daylight, reduced]);

  // Preview sky gradient from the previewed local sky.
  const top = mix(mix(NIGHT_TOP, DAY_TOP, sky.daylight), GOLD_TOP, sky.gold * 0.6);
  const bot = mix(mix(NIGHT_BOT, DAY_BOT, sky.daylight), GOLD_BOT, sky.gold * 0.7);
  const sunShown = sky.daylight > 0.15;
  const sunLeft = (hour / 24) * 100;
  const sunTop = 74 - sky.daylight * 58;

  const fmt = (h: number) => {
    const hh = Math.floor(h) % 24;
    const mm = Math.floor((h % 1) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.6 }}
          style={{ position: "fixed", inset: 0, zIndex: 240, display: "flex", flexDirection: "column" }}
        >
          {/* Preview sky */}
          <div style={{ position: "relative", flex: 1, overflow: "hidden", background: `linear-gradient(180deg, ${rgb(top)} 0%, ${rgb(bot)} 100%)`, transition: reduced ? undefined : "background 220ms linear" }}>
            {/* accent aurora wash */}
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(90% 70% at 50% 120%, hsl(${accentHue} 55% 60% / ${0.14 + sky.night * 0.16}), transparent 70%)` }} />
            {/* sun / moon */}
            <div
              style={{
                position: "absolute",
                left: `${sunLeft}%`,
                top: `${sunTop}%`,
                width: 64,
                height: 64,
                marginLeft: -32,
                borderRadius: "50%",
                background: sunShown
                  ? "radial-gradient(circle, #fff7e6, #ffd27a 60%, transparent 72%)"
                  : "radial-gradient(circle, #eef1ff, #c9d2f2 55%, transparent 70%)",
                filter: "blur(1px)",
                boxShadow: sunShown ? "0 0 80px 30px rgba(255,210,120,0.35)" : "0 0 50px 16px rgba(200,210,242,0.25)",
                transition: reduced ? undefined : "top 220ms linear, left 220ms linear",
              }}
            />
            {/* Canberra stars */}
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

            {/* readout */}
            <div style={{ position: "absolute", top: "var(--space-4)", left: "var(--space-4)", color: "rgba(255,255,255,0.92)" }}>
              <p className="type-caption" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
                A day through the site
              </p>
              <p style={{ fontSize: "clamp(28px, 5vw, 56px)", fontWeight: 500, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmt(hour)}</p>
              <p className="type-body" style={{ color: "rgba(255,255,255,0.72)", marginTop: 8, textTransform: "capitalize" }}>
                Your sky: {sky.label}
              </p>
              <p className="type-caption" style={{ color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                Canberra {cbr.hh}:{cbr.mm} · {asleep ? "Coen is asleep" : "Coen is awake"}
              </p>
              {asleep && sky.night > 0.5 && (
                <p className="type-caption" style={{ color: `hsl(${accentHue} 70% 78%)`, marginTop: 6 }}>
                  …this is when the site dreams.
                </p>
              )}
            </div>

            {/* accent swatch */}
            <div style={{ position: "absolute", top: "var(--space-4)", right: "var(--space-4)", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="type-caption" style={{ color: "rgba(255,255,255,0.6)" }}>accent</span>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: `hsl(${accentHue} 40% 62%)`, border: "1px solid rgba(255,255,255,0.4)" }} />
            </div>
          </div>

          {/* Controls */}
          <div style={{ background: "rgba(8,9,16,0.92)", padding: "var(--space-3) var(--space-4)", display: "flex", alignItems: "center", gap: 16 }}>
            <button type="button" onClick={() => setPlaying((p) => !p)} style={btn} disabled={reduced}>
              {playing ? "Pause" : "Play"}
            </button>
            <input
              type="range"
              min={0}
              max={24}
              step={0.05}
              value={hour}
              onChange={(e) => {
                setPlaying(false);
                setHour(parseFloat(e.target.value));
              }}
              aria-label="Hour of the day"
              style={{ flex: 1, accentColor: `hsl(${accentHue} 45% 60%)` }}
            />
            <button type="button" onClick={() => setOpen(false)} style={btn}>
              Leave
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

const btn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.85)",
  fontSize: "var(--fs-caption)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
