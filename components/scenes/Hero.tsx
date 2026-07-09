"use client";

import { motion, useTransform } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * Hero scene (§11). The COEN mark itself is HeroLogo (a persistent overlay in
 * AppShell) so the morph is continuous; this scene owns the surrounding hero
 * content — the subtitle and the single floating glass button — plus the 100vh
 * of scroll room the morph needs.
 *
 * The subtitle + CTA sit below the mark's hero position and ease away as you
 * begin to scroll, handing the stage to the sections below.
 */
export function Hero({ statement }: { statement: string }) {
  const reduced = useReducedMotion();
  const { scrollY, scrollTo } = useScrollProgress();

  // Fade + drift the hero content out over the first ~45% of a viewport. This is
  // scroll-linked opacity (not free-running motion), so it's fine when reduced —
  // but we skip the vertical drift in that case.
  const opacity = useTransform(
    scrollY,
    (y) => 1 - Math.min(y / (typeofWindowHeight() * 0.45), 1),
  );
  const y = useTransform(scrollY, (v) =>
    reduced ? 0 : Math.min(v * 0.15, 80),
  );

  return (
    <section
      id="top"
      aria-label="Introduction"
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Screen-reader H1: the visual COEN mark is decorative text in HeroLogo,
          so the accessible name of the page lives here. */}
      <h1
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        Coen — {statement}
      </h1>

      <motion.div
        style={{
          opacity,
          y,
          position: "absolute",
          top: "58%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "var(--space-4)",
          paddingInline: "var(--margin-mobile)",
        }}
      >
        <p
          className="type-h3"
          style={{
            maxWidth: "24ch",
            color: "var(--text-secondary)",
            fontWeight: 400,
          }}
        >
          {statement}
        </p>

        <GlassButton onClick={() => scrollTo("about")}>
          See the work
          <span aria-hidden style={{ opacity: 0.5 }}>
            ↓
          </span>
        </GlassButton>
      </motion.div>
    </section>
  );
}

/* Small guard so the transform mapper is SSR-safe (window may be undefined on
   the first server pass, though this is a client component). */
function typeofWindowHeight(): number {
  if (typeof window === "undefined") return 800;
  return window.innerHeight || 800;
}
