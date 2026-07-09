"use client";

import { useEffect, type ReactNode } from "react";
import { LazyMotion, domMax } from "framer-motion";
import {
  CapabilityContext,
  useMeasuredCapability,
} from "@/lib/capability";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useAccent } from "@/lib/accent";
import { SmoothScroll } from "./SmoothScroll";
import { Background } from "./Background";
import { LightField } from "./LightField";
import { HeroLogo } from "./HeroLogo";
import { Nav } from "./Nav";
import { Cursor } from "./Cursor";

/*
 * AppShell — the one client boundary that mounts every global system and holds
 * the shared providers. Everything that must persist across the single canvas
 * (background, light field, the morphing logo, nav, cursor) lives here, not in
 * page scenes, so nothing remounts as you move through the site.
 *
 * Server-rendered scene content is passed through as children.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const cap = useMeasuredCapability();
  const reduced = useReducedMotion();

  // Seed + (optionally) drift the accent hue.
  useAccent(reduced);

  // Hide the native cursor only when we're actually mounting the physics orb.
  useEffect(() => {
    const on = cap.ready && cap.finePointer && !reduced;
    document.body.dataset.customCursor = String(on);
    return () => {
      delete document.body.dataset.customCursor;
    };
  }, [cap.ready, cap.finePointer, reduced]);

  return (
    <CapabilityContext.Provider value={cap}>
      {/*
        LazyMotion + `m` ship a single feature bundle once instead of baking all
        of `motion`'s features into every import. `domMax` retains layout
        animation (the shared-element project expansion needs layoutId). `strict`
        forbids the heavier `motion` component so nothing silently reinflates the
        bundle.
      */}
      <LazyMotion features={domMax} strict>
        <SmoothScroll>
          <Background />
          <LightField />
          <HeroLogo />
          <Nav />
          <main id="main">{children}</main>
          <Cursor />
        </SmoothScroll>
      </LazyMotion>
    </CapabilityContext.Provider>
  );
}
