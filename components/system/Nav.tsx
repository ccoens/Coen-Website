"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, AnimatePresence, useMotionValueEvent, useTransform } from "framer-motion";
import { Glass } from "@/components/ui/Glass";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useContact } from "./Contact";

/*
 * Nav — the floating glass layer (§12), route-aware and responsive.
 *
 * Desktop (≥768px): the centred glass pill with the gliding active indicator.
 * Mobile (<768px): the pill would overflow and collide with the COEN logo, so
 * it collapses to a top-right menu button that opens a full-screen menu. Both
 * are always rendered; CSS shows the right one per breakpoint (no layout flash,
 * links stay in the SSR HTML). "Contact" opens the shared contact overlay.
 */

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/photography", label: "Photography" },
  { href: "/journal", label: "Journal" },
] as const;

export function Nav() {
  return (
    <>
      <DesktopNav />
      <MobileNav />
    </>
  );
}

/* ── Desktop pill ─────────────────────────────────────────────────────────── */

function DesktopNav() {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const { open: openContact } = useContact();
  const { scrollY, velocity } = useScrollProgress();
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
      data-cursor="hidden"
      className="nav-desktop"
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
        // Centred horizontally. `x` is a motion transform component so it
        // composes cleanly with the animated `y` above (no raw transform clash).
        left: "50%",
        x: "-50%",
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
                onClick={openContact}
              />
            </li>
          </ul>
        </Glass>
      </m.div>
    </m.nav>
  );
}

/* ── Mobile menu ──────────────────────────────────────────────────────────── */

function MobileNav() {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const { open: openContact } = useContact();
  const [open, setOpen] = useState(false);

  // Lock scroll + wire Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("scroll-locked");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("scroll-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Always close when the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="nav-mobile">
      {/* Menu / close toggle — top-right, clear of the COEN logo (top-left). */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          top: 14,
          right: 14,
          zIndex: 1001,
          width: 46,
          height: 46,
          borderRadius: 999,
          border: "1px solid var(--border-strong)",
          background: "var(--surface-solid)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
        }}
      >
        <MenuIcon open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "var(--bg)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 var(--margin-mobile)",
            }}
          >
            {/* Soft accent wash for depth. */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(90% 60% at 80% 0%, var(--accent-soft), transparent 60%)",
                pointerEvents: "none",
              }}
            />
            <nav
              aria-label="Primary"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              {LINKS.map((l, i) => (
                <MobileItem
                  key={l.href}
                  index={i}
                  reduced={reduced}
                  active={pathname === l.href}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    style={mobileLinkStyle(pathname === l.href)}
                  >
                    {l.label}
                  </Link>
                </MobileItem>
              ))}
              <MobileItem index={LINKS.length} reduced={reduced} active={false}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openContact();
                  }}
                  style={{ ...mobileLinkStyle(false), background: "transparent", border: "none", textAlign: "left", cursor: "pointer" }}
                >
                  Contact
                </button>
              </MobileItem>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileItem({
  children,
  index,
  reduced,
  active,
}: {
  children: React.ReactNode;
  index: number;
  reduced: boolean;
  active: boolean;
}) {
  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduced ? 0 : 0.06 * index + 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
    >
      {active && (
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)", flexShrink: 0 }}
        />
      )}
      {children}
    </m.div>
  );
}

function mobileLinkStyle(active: boolean) {
  return {
    display: "inline-block",
    fontSize: "clamp(34px, 11vw, 52px)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.05,
    textDecoration: "none",
    color: active ? "var(--accent)" : "var(--text-primary)",
    padding: "2px 0",
  } as const;
}

/* Two-bar icon that morphs between a menu glyph and a close (×). */
function MenuIcon({ open }: { open: boolean }) {
  const bar = {
    position: "absolute" as const,
    left: 0,
    width: 18,
    height: 2,
    borderRadius: 2,
    background: "var(--text-primary)",
    transition: "transform 260ms var(--ease-primary), opacity 200ms var(--ease-primary)",
  };
  return (
    <span aria-hidden style={{ position: "relative", width: 18, height: 12, display: "block" }}>
      <span style={{ ...bar, top: 1, transform: open ? "translateY(4px) rotate(45deg)" : "none" }} />
      <span style={{ ...bar, top: 9, transform: open ? "translateY(-4px) rotate(-45deg)" : "none" }} />
    </span>
  );
}

/* ── Shared desktop link ──────────────────────────────────────────────────── */

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
    // mailto/external → plain anchor; internal route → Next Link (client nav).
    if (/^(mailto:|https?:)/.test(href)) {
      return (
        <a href={href} style={style} {...handlers}>
          {inner}
        </a>
      );
    }
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
