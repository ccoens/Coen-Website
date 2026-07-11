"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { addDwell, SECTION_META } from "@/lib/engagement";

/*
 * EngagementTracker — quietly measures how long the visitor spends on each
 * interest route (projects, photography, journal, travel, about), pausing while
 * the tab is hidden. That accumulated attention is what the site later uses to
 * personalise and reflect. Route-level (no per-scene wiring), on-device only.
 */
export function EngagementTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const section = pathname === "/" ? null : pathname.replace(/^\//, "").split("/")[0];
    if (!section || !SECTION_META[section]) return;

    let start = document.hidden ? 0 : performance.now();
    let acc = 0;

    const onVis = () => {
      if (document.hidden) {
        if (start) {
          acc += performance.now() - start;
          start = 0;
        }
      } else {
        start = performance.now();
      }
    };
    const flush = () => {
      if (start) {
        acc += performance.now() - start;
        start = 0;
      }
      if (acc > 0) {
        addDwell(section, acc);
        acc = 0;
      }
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  return null;
}
