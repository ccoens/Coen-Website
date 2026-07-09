"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  revealVariants,
  revealVariantsReduced,
  revealViewport,
} from "@/lib/motion";

/*
 * Reveal — the fade+rise primitive (§13, §16). One implementation, used by
 * every scene. Reduced motion swaps to a pure-opacity variant with no transform
 * (§17) — the primitive ships both paths, it isn't an afterthought.
 *
 * `delay` drives the line/letter stagger (scenes pass stagger.line(i) etc.).
 * Each Reveal triggers on its own viewport entry, so a group that enters
 * together cascades by its delays.
 */

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** Stagger delay in seconds. */
  delay?: number;
};

export function Reveal({
  children,
  as = "div",
  className,
  style,
  delay = 0,
}: RevealProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion(as as ElementType);
  const variants = reduced ? revealVariantsReduced : revealVariants;

  return (
    <MotionTag
      className={className}
      style={style}
      variants={variants}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {children}
    </MotionTag>
  );
}
