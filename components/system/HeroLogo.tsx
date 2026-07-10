"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
// Per-letter parallax depth in px. Outer letters lead, inner letters follow at
// a shallower depth — the spread is what makes the word feel like a soft body
// leaning toward the cursor rather than a rigid block sliding.
const DEPTH = [17, 10, 10, 17];
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

  // Only the landing route runs the scroll morph. On every other route the mark
  // is simply the docked nav logo from the first frame.
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isHomeRef = useRef(isHome);
  isHomeRef.current = isHome;

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

  // heroAmt: 1 at the top of home, 0 once the mark has fully docked. The morph
  // completes over ~55% of the first viewport — a continuous, unhurried hand-off.
  // It's a settable value (not a pure scroll transform) so route changes can
  // force the docked state even when the scroll position doesn't change.
  const heroAmt = useMotionValue(isHome ? 1 : 0);
  const recomputeHeroAmt = useCallback(() => {
    if (!isHomeRef.current) {
      heroAmt.set(0);
      return;
    }
    const y = scrollY.get();
    heroAmt.set(clamp(1 - y / (geom.current.vh * 0.55), 0, 1));
  }, [heroAmt, scrollY]);

  useMotionValueEvent(scrollY, "change", recomputeHeroAmt);
  // Re-evaluate on navigation: leaving home docks it, returning re-morphs.
  useEffect(() => {
    recomputeHeroAmt();
  }, [isHome, recomputeHeroAmt]);

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

  // Hero pointer parallax + idle "breathing". The cursor drives px/py while it
  // moves; after a short rest the letters keep drifting on a slow, self-running
  // orbit so the mark is never fully static. Only meaningful near the top (the
  // per-letter offset is multiplied by heroAmt); disabled if calm/touch.
  useEffect(() => {
    if (reduced || !finePointer) return;

    let idle = false;
    let idleSince = 0;
    let idleTimer: number | undefined;
    let raf = 0;

    const goIdle = () => {
      idle = true;
      idleSince = performance.now();
    };
    // Begin breathing if the visitor never moves the pointer at all.
    idleTimer = window.setTimeout(goIdle, 2600);

    const onMove = (e: PointerEvent) => {
      idle = false;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(goIdle, 2600);
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };

    // Slow Lissajous drift; amplitude eases in over ~1.4s so it never jumps.
    const tick = (now: number) => {
      if (idle) {
        const t = (now - idleSince) / 1000;
        const amp = Math.min(t / 1.4, 1) * 0.32;
        px.set(Math.sin(t * 0.55) * amp);
        py.set(Math.sin(t * 0.42 + 1.3) * amp * 0.8);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.clearTimeout(idleTimer);
      cancelAnimationFrame(raf);
    };
  }, [reduced, finePointer, px, py]);

  // Docked logo acts as "home": scroll to top on the landing route, otherwise
  // navigate back to it.
  const onLogoActivate = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    } else {
      router.push("/");
    }
  };

  return (
    <m.div
      // One-time fade-in on load — part of the "composed" landing entrance.
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? undefined : { opacity: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
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
        aria-label={isNav ? (isHome ? "Coen — back to top" : "Coen — home") : undefined}
        tabIndex={isNav ? 0 : -1}
        onClick={isNav ? onLogoActivate : undefined}
        onKeyDown={
          isNav
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onLogoActivate();
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
            grabbable={!reduced && finePointer && !isNav}
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
  grabbable,
}: {
  char: string;
  depth: number;
  heroAmt: ReturnType<typeof useMotionValue<number>>;
  px: ReturnType<typeof useMotionValue<number>>;
  py: ReturnType<typeof useMotionValue<number>>;
  enabled: boolean;
  grabbable: boolean;
}) {
  // Offset = pointer × depth × how-hero-we-still-are. Multiplied through so the
  // parallax is present in the hero and gone in the nav.
  const lx = useTransform([px, heroAmt], ([p, a]: number[]) =>
    enabled ? p * depth * a : 0,
  );
  const ly = useTransform([py, heroAmt], ([p, a]: number[]) =>
    enabled ? p * (depth * 0.72) * a : 0,
  );
  // Soft, floaty spring — low stiffness plus mass scaled by the letter's depth
  // means the deeper (outer) letters lag a touch more, so the word trails the
  // cursor as a gentle wave and eases back with a slight overshoot. This is the
  // difference between "liquid" and "stiff".
  const springCfg = {
    stiffness: 70,
    damping: 15,
    mass: 0.85 + depth * 0.06,
  };
  const sx = useSpring(lx, springCfg);
  const sy = useSpring(ly, springCfg);

  // Soft-body layer: the outer span carries the parallax; the inner span is
  // grabbable. `dragSnapToOrigin` + a bouncy dragTransition means a flung letter
  // wobbles back to place like it's on elastic — a name you can physically
  // throw. Only live in the hero (grabbable=false once docked as the nav logo,
  // so it stays a clean clickable link). pointerEvents is re-enabled here even
  // though the hero overlay is inert, so only the glyphs themselves catch drags.
  return (
    <m.span
      style={{ display: "inline-block", x: sx, y: sy, willChange: "transform" }}
    >
      <m.span
        drag={grabbable}
        dragSnapToOrigin
        // Tether to a small radius so a grab is an elastic tug near home, not a
        // free throw across the screen — past the box it resists hard, then
        // springs back with a soft, settled wobble.
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        dragElastic={0.28}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 150, bounceDamping: 16 }}
        whileDrag={{ scale: 1.08 }}
        style={{
          display: "inline-block",
          cursor: grabbable ? "grab" : "inherit",
          pointerEvents: grabbable ? "auto" : "none",
          touchAction: grabbable ? "none" : "auto",
        }}
      >
        {char}
      </m.span>
    </m.span>
  );
}
