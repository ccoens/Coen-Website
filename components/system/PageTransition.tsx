"use client";

import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * PageTransition — fluid route transitions (the Apple "content flows in/out"
 * feel) on top of Next's App Router.
 *
 * App Router swaps the route subtree the moment you navigate, so a normal
 * AnimatePresence can't play an exit animation on the outgoing page — its
 * content is already gone. FrozenRouter fixes this: it snapshots the router
 * context so the exiting page keeps rendering its *old* content until its exit
 * animation finishes. This is the well-known pattern for framer + App Router.
 *
 * The shared systems (background, cursor, nav, light field) live above this in
 * AppShell and never remount, so only the page body morphs — continuity is
 * preserved even though these are real, shareable routes.
 */

function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;
  if (!frozen) return <>{children}</>;
  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

/*
 * RouteSweep — the signature flourish. On every navigation an accent hairline
 * shoots across the very top of the viewport (origin left → right) then fades.
 * It's the site's connective "handoff" gesture, tinted by the live accent hue.
 * A counter re-keys the element so it replays each route change; the first
 * render is skipped so it never fires on initial load.
 */
function RouteSweep({ pathname }: { pathname: string }) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setCount((c) => c + 1);
  }, [pathname]);

  if (reduced || count === 0) return null;

  return (
    <m.div
      key={count}
      aria-hidden
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: 1, opacity: 0 }}
      transition={{
        scaleX: { duration: 0.6, ease: [0.65, 0, 0.35, 1] },
        opacity: { delay: 0.52, duration: 0.35 },
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2.5,
        background: "var(--accent)",
        transformOrigin: "left center",
        zIndex: 200,
        pointerEvents: "none",
        boxShadow: "0 0 14px hsl(var(--accent-h) var(--accent-s) 55% / 0.7)",
      }}
    />
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  // Reduced motion: no travel, a whisper of a cross-fade only.
  const variants = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        // A touch of scale + blur + rise so the page "assembles" in, not just
        // fades — the Apple content-flow feel, paired with the accent sweep.
        initial: { opacity: 0, y: 22, scale: 0.99, filter: "blur(8px)" },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        },
        exit: {
          opacity: 0,
          y: -14,
          scale: 0.995,
          filter: "blur(8px)",
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        },
      };

  return (
    <>
      <RouteSweep pathname={pathname} />
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={pathname}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ willChange: "transform, opacity, filter" }}
        >
          <FrozenRouter>{children}</FrozenRouter>
        </m.div>
      </AnimatePresence>
    </>
  );
}
