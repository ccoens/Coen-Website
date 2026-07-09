"use client";

import { useState } from "react";
import { m, useMotionValueEvent, useTransform } from "framer-motion";
import { Glass } from "@/components/ui/Glass";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * Nav — the floating glass layer (§12). Not a bar. The top-left logo is the
 * morphed COEN (HeroLogo, rendered separately); this is the top-right link
 * cluster. It appears only once the hero morph has essentially completed, and
 * its opacity eases down slightly while the page is scrolling fast, settling to
 * full when the scroll rests. Hover thickens the glass and runs a centre-out
 * light-sweep underline.
 */

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "photography", label: "Photography" },
  { id: "journal", label: "Journal" },
  { id: "current", label: "Current" },
  { id: "contact", label: "Contact" },
] as const;

export function Nav() {
  const reduced = useReducedMotion();
  const { scrollY, velocity, scrollTo } = useScrollProgress();
  const [shown, setShown] = useState(false);

  // Reveal after the morph: ~60% of the first viewport scrolled.
  useMotionValueEvent(scrollY, "change", (y) => {
    const threshold = window.innerHeight * 0.6;
    setShown((prev) => {
      const next = y > threshold;
      return prev !== next ? next : prev;
    });
  });

  // Opacity dips while scrolling fast, returns to full at rest (§12).
  const velOpacity = useTransform(velocity, (v) =>
    reduced ? 1 : 1 - Math.min(Math.abs(v) * 0.012, 0.35),
  );

  return (
    <m.nav
      aria-label="Primary"
      initial={false}
      animate={{
        opacity: shown ? 1 : 0,
        y: shown ? 0 : -12,
        pointerEvents: shown ? "auto" : "none",
      }}
      transition={{ duration: reduced ? 0.15 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        top: 18,
        right: "var(--nav-margin, 20px)",
        zIndex: "var(--z-nav)" as unknown as number,
      }}
    >
      <m.div style={{ opacity: velOpacity }}>
        <Glass as="div" variant="nav" radius="lg" blur={20}>
          <ul
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-1)",
              listStyle: "none",
              padding: "8px 10px",
              margin: 0,
            }}
          >
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <NavLink
                  label={s.label}
                  onClick={() => scrollTo(s.id)}
                  reduced={reduced}
                />
              </li>
            ))}
          </ul>
        </Glass>
      </m.div>
    </m.nav>
  );
}

function NavLink({
  label,
  onClick,
  reduced,
}: {
  label: string;
  onClick: () => void;
  reduced: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        position: "relative",
        background: "transparent",
        border: "none",
        padding: "8px 12px",
        borderRadius: "999px",
        fontSize: "var(--fs-caption)",
        fontWeight: 500,
        letterSpacing: "0.01em",
        color: hover ? "var(--text-primary)" : "var(--text-secondary)",
        transition: "color 200ms var(--ease-primary)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {/* Centre-out light-sweep underline (§12, §14). */}
      <m.span
        aria-hidden
        initial={false}
        animate={{ scaleX: hover ? 1 : 0, opacity: hover ? 1 : 0 }}
        transition={{ duration: reduced ? 0.12 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 4,
          height: 1.5,
          transformOrigin: "center",
          background:
            "linear-gradient(90deg, transparent, var(--accent), transparent)",
        }}
      />
    </button>
  );
}
