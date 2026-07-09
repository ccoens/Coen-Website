"use client";

import { m } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
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

// `as` is limited to intrinsic tags: strict LazyMotion forbids the motion()
// factory, so we index the `m` namespace by tag name. All scene usages pass a
// plain tag ("div", "p", "article").
type MotionTagName = keyof typeof m & keyof React.JSX.IntrinsicElements;

type RevealProps = {
  children: ReactNode;
  as?: MotionTagName;
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
  const MotionTag = m[as] as React.ElementType;
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
