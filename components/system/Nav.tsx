"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, useMotionValueEvent, useTransform } from "framer-motion";
import { Glass } from "@/components/ui/Glass";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * Nav — the floating glass layer (§12), now route-aware. The top-left logo is
 * the morphed COEN (HeroLogo); this is the top-right cluster. Section links are
 * real routes (Next <Link>) so navigating triggers the fluid PageTransition;
 * "Contact" is an in-page scroll to the footer.
 *
 * On the landing route it appears only after the hero morph; on every other
 * route it's present from the first frame. Opacity eases down slightly while
 * scrolling fast. Hover runs a centre-out light-sweep underline; the active
 * route keeps the underline lit.
 */

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/photography", label: "Photography" },
  { href: "/journal", label: "Journal" },
] as const;

export function Nav() {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const { scrollY, velocity, scrollTo } = useScrollProgress();
  const isHome = pathname === "/";
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  // Which item the gliding pill currently sits under: the hovered one, or the
  // active route when nothing is hovered.
  const [hovered, setHovered] = useState<string | null>(null);
  const target = hovered ?? pathname;

  // On home, reveal after ~60% of the first viewport; elsewhere, always shown.
  useMotionValueEvent(scrollY, "change", (y) => {
    const past = y > window.innerHeight * 0.6;
    setScrolledPastHero((prev) => (prev !== past ? past : prev));
  });
  const shown = !isHome || scrolledPastHero;

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
            onPointerLeave={() => setHovered(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-1)",
              listStyle: "none",
              padding: "8px 10px",
              margin: 0,
            }}
          >
            {LINKS.map((l) => (
              <li key={l.href}>
                <NavLink
                  href={l.href}
                  label={l.label}
                  active={pathname === l.href}
                  showPill={target === l.href}
                  reduced={reduced}
                  onHover={() => setHovered(l.href)}
                />
              </li>
            ))}
            <li>
              <NavLink
                label="Contact"
                active={false}
                showPill={target === "contact"}
                reduced={reduced}
                onHover={() => setHovered("contact")}
                onClick={() => scrollTo("contact")}
              />
            </li>
          </ul>
        </Glass>
      </m.div>
    </m.nav>
  );
}

function NavLink({
  href,
  label,
  active,
  showPill,
  reduced,
  onHover,
  onClick,
}: {
  href?: string;
  label: string;
  active: boolean;
  showPill: boolean;
  reduced: boolean;
  onHover: () => void;
  onClick?: () => void;
}) {
  const style = {
    position: "relative" as const,
    display: "inline-block",
    background: "transparent",
    border: "none",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "var(--fs-caption)",
    fontWeight: 500,
    letterSpacing: "0.01em",
    color: showPill || active ? "var(--text-primary)" : "var(--text-secondary)",
    transition: "color 220ms var(--ease-primary)",
    whiteSpace: "nowrap" as const,
    textDecoration: "none",
    cursor: "pointer",
  };

  // The gliding chip. Because only one item mounts it at a time and they share
  // one layoutId, framer animates it smoothly between items. A hairline accent
  // rule under the *active route* distinguishes "current page" from a hover.
  const pill = showPill ? (
    <m.span
      aria-hidden
      layoutId="nav-pill"
      transition={
        reduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 32, mass: 0.7 }
      }
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "999px",
        background: "var(--accent-soft)",
        border: "1px solid hsl(var(--accent-h) var(--accent-s) 60% / 0.28)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
        zIndex: 0,
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            left: "26%",
            right: "26%",
            bottom: 5,
            height: 1.5,
            borderRadius: 2,
            background: "var(--accent)",
          }}
        />
      )}
    </m.span>
  ) : null;

  const handlers = {
    onPointerEnter: onHover,
    onFocus: onHover,
  };

  const inner = (
    <>
      {pill}
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} style={style} aria-current={active ? "page" : undefined} {...handlers}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} style={style} {...handlers}>
      {inner}
    </button>
  );
}
