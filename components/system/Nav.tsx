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
                  reduced={reduced}
                />
              </li>
            ))}
            <li>
              <NavLink
                label="Contact"
                active={false}
                reduced={reduced}
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
  reduced,
  onClick,
}: {
  href?: string;
  label: string;
  active: boolean;
  reduced: boolean;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const lit = hover || active;

  const style = {
    position: "relative" as const,
    display: "inline-block",
    background: "transparent",
    border: "none",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "var(--fs-caption)",
    fontWeight: 500,
    letterSpacing: "0.01em",
    color: lit ? "var(--text-primary)" : "var(--text-secondary)",
    transition: "color 200ms var(--ease-primary)",
    whiteSpace: "nowrap" as const,
    textDecoration: "none",
    cursor: "pointer",
  };

  const underline = (
    <m.span
      aria-hidden
      initial={false}
      animate={{ scaleX: lit ? 1 : 0, opacity: lit ? 1 : 0 }}
      transition={{ duration: reduced ? 0.12 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 4,
        height: 1.5,
        transformOrigin: "center",
        background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
      }}
    />
  );

  const handlers = {
    onPointerEnter: () => setHover(true),
    onPointerLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
  };

  if (href) {
    return (
      <Link href={href} style={style} aria-current={active ? "page" : undefined} {...handlers}>
        {label}
        {underline}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} style={style} {...handlers}>
      {label}
      {underline}
    </button>
  );
}
