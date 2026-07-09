"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  m,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useCapability } from "@/lib/capability";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { springSoftOptions } from "@/lib/motion";

/*
 * HeroLogo — THE crux (§11). "COEN" is ONE DOM element. A scroll-driven morph
 * amount (1 = full hero, 0 = docked nav logo) drives its scale and position
 * continuously — there is no hero title that fades out and a separate nav logo
 * that fades in. Hero and Nav read the same element; the transition is literally
 * one object moving.
 *
 * Implementation notes:
 *  - We render at nav font size (20px) and SCALE up for the hero, so the whole
 *    morph is transform-only (no layout, no font-size animation) — cheap and
 *    smooth. offsetWidth/Height give the natural (unscaled) size because CSS
 *    transforms don't affect layout metrics.
 *  - Geometry is read from a ref inside the transform mappers, so viewport
 *    resizes take effect without re-creating hooks.
 *  - Per-character cursor parallax (2–6px) only bites while heroAmt is high, so
 *    it vanishes as the mark docks. Disabled under reduced motion / touch.
 */

const LETTERS = ["C", "O", "E", "N"] as const;
// Per-letter parallax depth in px (§11: 2–6px range).
const DEPTH = [6, 3.5, 3.5, 6];
const NAV_FONT = 20;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

interface Geom {
  vw: number;
  vh: number;
  logoW: number;
  logoH: number;
  navLeft: number;
  navTop: number;
  heroScale: number;
}

export function HeroLogo() {
  const reduced = useReducedMotion();
  const { finePointer } = useCapability();
  const { scrollY } = useScrollProgress();

  const ref = useRef<HTMLDivElement>(null);
  const geom = useRef<Geom>({
    vw: 1200,
    vh: 800,
    logoW: 80,
    logoH: 20,
    navLeft: 20,
    navTop: 22,
    heroScale: 6,
  });
  const [isNav, setIsNav] = useState(false);
  // The logo is a fixed overlay; over the dark Photography scene, dark text
  // would vanish. Track whether a dark section sits under the docked mark and
  // flip its colour so it reads on any field.
  const [overDark, setOverDark] = useState(false);

  // Pointer position, normalised to [-1, 1], for the hero per-char parallax.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Breakpoint margins mirror the layout system (§3): 20 / 40 / 80.
    const navLeft = vw >= 1120 ? 80 : vw >= 768 ? 40 : 20;
    const heroFont = clamp(0.12 * vw, 72, 140);
    geom.current = {
      vw,
      vh,
      logoW: el.offsetWidth,
      logoH: el.offsetHeight,
      navLeft,
      navTop: 22,
      heroScale: heroFont / NAV_FONT,
    };
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // heroAmt: 1 at the top, 0 once the mark has fully docked. The morph completes
  // over ~55% of the first viewport — a continuous, unhurried hand-off.
  const heroAmt = useTransform(scrollY, (y) =>
    clamp(1 - y / (geom.current.vh * 0.55), 0, 1),
  );

  // Position + scale, computed from geometry read live from the ref.
  const rawScale = useTransform(heroAmt, (a) =>
    lerp(1, geom.current.heroScale, a),
  );
  const rawX = useTransform(heroAmt, (a) => {
    const g = geom.current;
    const xHero = g.vw / 2 - (g.logoW * g.heroScale) / 2;
    return lerp(g.navLeft, xHero, a);
  });
  const rawY = useTransform(heroAmt, (a) => {
    const g = geom.current;
    const yHero = g.vh * 0.42 - (g.logoH * g.heroScale) / 2;
    return lerp(g.navTop, yHero, a);
  });

  // A gentle spring removes scroll micro-jitter without adding visible lag.
  // Under reduced motion we stiffen it so the mark tracks scroll near-1:1.
  const spring = reduced
    ? { stiffness: 400, damping: 40 }
    : springSoftOptions;
  const scale = useSpring(rawScale, spring);
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);

  // Toggle interactivity + nav styling once mostly docked.
  useMotionValueEvent(heroAmt, "change", (a) => {
    const nav = a < 0.5;
    setIsNav((prev) => (prev !== nav ? nav : prev));
  });

  // Flip the mark's colour when a dark section passes under the docked logo.
  useMotionValueEvent(scrollY, "change", () => {
    const el = document.getElementById("photography");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const probeY = 30; // the docked logo sits ~30px from the top
    setOverDark((prev) => {
      const next = r.top <= probeY && r.bottom >= probeY;
      return prev !== next ? next : prev;
    });
  });

  // Hero pointer parallax. Only meaningful near the top; disabled if calm/touch.
  useEffect(() => {
    if (reduced || !finePointer) return;
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, finePointer, px, py]);

  const goTop = () => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <m.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: "var(--z-nav)" as unknown as number,
        transformOrigin: "top left",
        x,
        y,
        scale,
        // The docked logo is clickable (scroll to top); the giant hero title is
        // inert so it never swallows clicks meant for the hero CTA below it.
        pointerEvents: isNav ? "auto" : "none",
      }}
    >
      <div
        ref={ref}
        role={isNav ? "link" : undefined}
        aria-label={isNav ? "Coen — back to top" : undefined}
        tabIndex={isNav ? 0 : -1}
        onClick={isNav ? goTop : undefined}
        onKeyDown={
          isNav
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goTop();
                }
              }
            : undefined
        }
        style={{
          display: "flex",
          fontSize: NAV_FONT,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 0.95,
          color: overDark ? "var(--dark-text-primary)" : "var(--text-primary)",
          transition: "color 300ms var(--ease-primary)",
          userSelect: "none",
          cursor: isNav ? "pointer" : "default",
        }}
      >
        {LETTERS.map((ch, i) => (
          <HeroLetter
            key={ch + i}
            char={ch}
            depth={DEPTH[i]}
            heroAmt={heroAmt}
            px={px}
            py={py}
            enabled={!reduced && finePointer}
          />
        ))}
      </div>
    </m.div>
  );
}

/* One letter, with cursor parallax that fades out as the mark docks. */
function HeroLetter({
  char,
  depth,
  heroAmt,
  px,
  py,
  enabled,
}: {
  char: string;
  depth: number;
  heroAmt: ReturnType<typeof useMotionValue<number>>;
  px: ReturnType<typeof useMotionValue<number>>;
  py: ReturnType<typeof useMotionValue<number>>;
  enabled: boolean;
}) {
  // Offset = pointer × depth × how-hero-we-still-are. Multiplied through so the
  // parallax is present in the hero and gone in the nav.
  const lx = useTransform([px, heroAmt], ([p, a]: number[]) =>
    enabled ? p * depth * a : 0,
  );
  const ly = useTransform([py, heroAmt], ([p, a]: number[]) =>
    enabled ? p * (depth * 0.6) * a : 0,
  );
  const sx = useSpring(lx, { stiffness: 140, damping: 18, mass: 0.6 });
  const sy = useSpring(ly, { stiffness: 140, damping: 18, mass: 0.6 });

  return (
    <m.span
      style={{ display: "inline-block", x: sx, y: sy, willChange: "transform" }}
    >
      {char}
    </m.span>
  );
}
