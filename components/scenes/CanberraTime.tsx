"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { canberraNow, canberraStatus } from "@/lib/time";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * CanberraTime — the first beat after the hero: a large, live "Time in Canberra"
 * readout (Ritz-style, but on our calm off-white field). As it scrolls into
 * view it focuses in — a soft blur→sharp "sync" — then holds, the colon quietly
 * pulsing to prove it's live. The site opens with where Coen is, and when.
 *
 * Time is client-only (a mounted gate prevents a hydration mismatch on the
 * changing digits). Reduced motion drops the focus + pulse but keeps the time.
 */
export function CanberraTime() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => canberraNow());

  useEffect(() => {
    setMounted(true);
    setNow(canberraNow());
    const id = setInterval(() => setNow(canberraNow()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = mounted ? `${now.hh}:${now.mm}` : "··:··";
  const [hh, mm] = time.split(":");

  return (
    <section
      aria-label="Local time in Canberra"
      style={{
        position: "relative",
        minHeight: "88svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        paddingInline: "var(--margin-mobile)",
      }}
    >
      {/* Faint accent glow behind the numerals for depth. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: "min(80vw, 900px)",
          height: "min(80vw, 900px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, hsl(var(--accent-h) var(--accent-s) 82% / 0.35), transparent 62%)",
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      <m.div
        initial={reduced ? false : { opacity: 0, filter: "blur(14px)", y: 24 }}
        whileInView={
          reduced ? undefined : { opacity: 1, filter: "blur(0px)", y: 0 }
        }
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <p
          className="type-caption"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
            marginBottom: "var(--space-3)",
          }}
        >
          <span className="live-dot" style={{ width: 7, height: 7 }} />
          Time in Canberra
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            fontSize: "clamp(84px, 20vw, 300px)",
            fontWeight: 500,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-primary)",
          }}
        >
          <span>{hh}</span>
          <m.span
            aria-hidden
            animate={reduced ? undefined : { opacity: [1, 0.35, 1] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            style={{ padding: "0 0.06em", color: "var(--accent)" }}
          >
            :
          </m.span>
          <span>{mm}</span>
        </div>

        <p
          className="type-body"
          style={{ color: "var(--text-secondary)", marginTop: "var(--space-3)", maxWidth: "34ch", minHeight: "1.6em" }}
        >
          {mounted ? canberraStatus(now) : " "}
        </p>
      </m.div>
    </section>
  );
}
