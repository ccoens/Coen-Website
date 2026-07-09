"use client";

import { m, useMotionValue, useSpring } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useCapability } from "@/lib/capability";

/*
 * Magnetic — pulls its child gently toward the cursor while hovered, then
 * springs back on leave. The classic Apple/agency "the button reaches for you"
 * microinteraction. Small pull radius so it feels precise, not gooey.
 *
 * Static wrapper on touch / reduced motion / low-capability.
 */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  /** Fraction of the cursor offset the element follows. */
  strength?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { finePointer, ready } = useCapability();
  const enabled = ready && finePointer && !reduced;

  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 200, damping: 15, mass: 0.5 });

  const onMove = (e: React.PointerEvent) => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <m.div
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy, display: "inline-flex", willChange: "transform" }}
    >
      {children}
    </m.div>
  );
}
