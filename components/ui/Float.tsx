"use client";

import { m } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * Float — a slow, perpetual vertical drift that keeps the landing feeling alive
 * without demanding attention. Each instance takes a phase offset so a group
 * breathes out of sync rather than bobbing in unison. Transform-only.
 *
 * Reduced motion → static passthrough.
 */
export function Float({
  children,
  amplitude = 8,
  duration = 6,
  phase = 0,
  className,
  style,
}: {
  children: ReactNode;
  amplitude?: number;
  duration?: number;
  phase?: number; // 0..1 offset into the cycle
  className?: string;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <m.div
      className={className}
      style={{ ...style, willChange: "transform" }}
      animate={{ y: [-amplitude, amplitude, -amplitude] }}
      transition={{
        duration,
        ease: "easeInOut",
        repeat: Infinity,
        delay: -phase * duration,
      }}
    >
      {children}
    </m.div>
  );
}
