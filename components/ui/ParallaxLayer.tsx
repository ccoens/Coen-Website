"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { springSoftOptions } from "@/lib/motion";

/*
 * ParallaxLayer — depth drift on scroll (§13 About/Photography). Translates its
 * child on the Y axis as it passes through the viewport, softened by a spring so
 * it never feels linear or mechanical. Transform-only — no layout thrash.
 *
 * Reduced motion → renders a plain static wrapper (no transform, no listener).
 */

export function ParallaxLayer({
  children,
  speed = 0.15,
  className,
  style,
}: {
  children: ReactNode;
  /** Fraction of travel relative to scroll through the element. Small by design. */
  speed?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Track this element's progress through the viewport (0 entering → 1 leaving).
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Map that progress to a small vertical offset; spring-smooth the result.
  const raw = useTransform(
    scrollYProgress,
    [0, 1],
    [speed * 100, -speed * 100],
  );
  const y = useSpring(raw, springSoftOptions);

  if (reduced) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, y, willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}
