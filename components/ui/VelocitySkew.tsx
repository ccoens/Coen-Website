"use client";

import { m, useSpring, useTransform } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * VelocitySkew — the signature "fluid" scroll feel: content leans and stretches
 * a touch with scroll velocity, then springs back to rest. Deliberately tiny
 * (≤3.5°) so it reads as momentum, not a gimmick. Transform-only.
 *
 * Reduced motion → static passthrough.
 */
export function VelocitySkew({
  children,
  className,
  style,
  max = 3.5,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  max?: number;
}) {
  const reduced = useReducedMotion();
  const { velocity } = useScrollProgress();

  // Spring-smooth the raw Lenis velocity, then map to a small skew + squash.
  const smooth = useSpring(velocity, { stiffness: 200, damping: 40, mass: 0.6 });
  const skewY = useTransform(smooth, [-60, 0, 60], [max, 0, -max], {
    clamp: true,
  });
  const scaleY = useTransform(smooth, [-60, 0, 60], [1.03, 1, 1.03], {
    clamp: true,
  });

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
      style={{ ...style, skewY, scaleY, willChange: "transform" }}
    >
      {children}
    </m.div>
  );
}
