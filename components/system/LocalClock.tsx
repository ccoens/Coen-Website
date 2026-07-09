"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { m, useMotionValueEvent } from "framer-motion";
import { canberraNow } from "@/lib/time";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * LocalClock — a live "Time in Canberra" readout (the site is a window into
 * where Coen is). Like the Ritz Paris clock, it sits quietly in a corner. On the
 * landing it stays hidden over the hero, then reveals as you scroll and "syncs"
 * to the live time — the ticking seconds are the proof it's real.
 *
 * Landing route only. Reduced motion keeps the ticking (it's data, not
 * decoration) but drops the sync/blur flourish.
 */
export function LocalClock() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const { scrollY } = useScrollProgress();

  const [revealed, setRevealed] = useState(false);
  const [synced, setSynced] = useState(false);
  const [now, setNow] = useState(() => canberraNow());
  // Time is client-only; render placeholders until mounted so SSR and the first
  // client render match (no hydration mismatch on the ever-changing seconds).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isHome = pathname === "/";

  // Reveal once the hero has begun to leave.
  useMotionValueEvent(scrollY, "change", (y) => {
    if (!revealed && y > window.innerHeight * 0.35) setRevealed(true);
  });

  // Tick every second while revealed; establish the "sync" a beat after reveal.
  useEffect(() => {
    if (!revealed) return;
    setNow(canberraNow());
    const id = setInterval(() => setNow(canberraNow()), 1000);
    const t = reduced ? 0 : 700;
    const sync = setTimeout(() => setSynced(true), t);
    return () => {
      clearInterval(id);
      clearTimeout(sync);
    };
  }, [revealed, reduced]);

  if (!isHome) return null;

  return (
    <m.div
      aria-hidden={!revealed}
      initial={false}
      animate={{
        opacity: revealed ? 1 : 0,
        y: revealed ? 0 : 12,
      }}
      transition={{ duration: reduced ? 0.2 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        left: "calc(var(--nav-margin, 20px) - 14px)",
        bottom: "calc(var(--space-3) - 10px)",
        zIndex: 40,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "14px 20px 14px 14px",
        // Soft scrim so the readout stays legible over anything behind it,
        // without a hard box — it fades into the field.
        background:
          "radial-gradient(130% 130% at 6% 94%, rgba(247,247,245,0.92) 0%, rgba(247,247,245,0.55) 42%, transparent 74%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "var(--fs-caption)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
        }}
      >
        <span className="live-dot" style={{ width: 6, height: 6 }} />
        {mounted ? `${now.partOfDay} in Canberra` : "Time in Canberra"}
      </div>
      <m.div
        animate={{
          filter: synced ? "blur(0px)" : "blur(5px)",
          opacity: synced ? 1 : 0.45,
        }}
        transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontSize: "clamp(20px, 2vw, 26px)",
          fontWeight: 500,
          letterSpacing: "0.01em",
          fontVariantNumeric: "tabular-nums",
          color: "var(--text-primary)",
        }}
      >
        {mounted && synced ? `${now.hh}:${now.mm}:${now.ss}` : "··:··:··"}
      </m.div>
    </m.div>
  );
}
