"use client";

import { useEffect, type ReactNode } from "react";
import { LazyMotion, domMax } from "framer-motion";
import {
  CapabilityContext,
  useMeasuredCapability,
} from "@/lib/capability";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useAccent } from "@/lib/accent";
import { useSky } from "@/lib/sky";
import { useVitality } from "@/lib/vitality";
import { startPulse } from "@/lib/behaviorPulse";
import { recordVisitTime } from "@/lib/rhythm";
import { SmoothScroll } from "./SmoothScroll";
import { Background } from "./Background";
import { SkyWash } from "./SkyWash";
import { RestVeil } from "./RestVeil";
import { LightField } from "./LightField";
import { HeroLogo } from "./HeroLogo";
import { Nav } from "./Nav";
import { Cursor } from "./Cursor";
import { Echoes } from "./Echoes";
import { Screensaver } from "./Screensaver";
import { VisitorSignal } from "./VisitorSignal";
import { EngagementTracker } from "./EngagementTracker";
import { Perceptive } from "./Perceptive";
import { Predictor } from "./Predictor";
import { Dossier } from "./Dossier";
import { ExitIntent } from "./ExitIntent";
import { Dream } from "./Dream";
import { StarSketch } from "./StarSketch";
import { SkyTimelapse } from "./SkyTimelapse";
import { ScreenshotGuard } from "./ScreenshotGuard";
import { PageTransition } from "./PageTransition";
import { ContactProvider } from "./Contact";

/*
 * AppShell — the one client boundary that mounts every global system and holds
 * the shared providers. Everything that must persist across routes (background,
 * light field, the morphing logo, nav, cursor) lives here, not in pages, so
 * nothing remounts as you move through the site — that persistence is what lets
 * page transitions feel continuous even though these are real routes.
 *
 * The routed page body is wrapped in PageTransition for the fluid handoff.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const cap = useMeasuredCapability();
  const reduced = useReducedMotion();

  // Seed + (optionally) drift the accent hue.
  useAccent(reduced);
  // Publish the visitor's real local sky (timezone + solar geometry) to CSS.
  useSky();
  // The circadian pulse: the site quietens while Coen sleeps in Canberra.
  useVitality();

  // Begin reading the visitor (all on-device): motion pulse + visit rhythm.
  useEffect(() => {
    startPulse();
    recordVisitTime();
  }, []);

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
          <ContactProvider>
            <Background />
            <SkyWash />
            <Echoes />
            <LightField />
            <HeroLogo />
            <Nav />
            <main id="main">
              <PageTransition>{children}</PageTransition>
            </main>
            <RestVeil />
            <Cursor />
            <Screensaver />
            <VisitorSignal />
            <EngagementTracker />
            <Perceptive />
            <Predictor />
            <Dossier />
            <ExitIntent />
            <Dream />
            <StarSketch />
            <SkyTimelapse />
            <ScreenshotGuard />
          </ContactProvider>
        </SmoothScroll>
      </LazyMotion>
    </CapabilityContext.Provider>
  );
}
