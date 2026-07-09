"use client";

import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { useContext, useRef, type ReactNode } from "react";
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
        initial: { opacity: 0, y: 18, filter: "blur(6px)" },
        animate: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
        exit: {
          opacity: 0,
          y: -12,
          filter: "blur(6px)",
          transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
        },
      };

  return (
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
  );
}
