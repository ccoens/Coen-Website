"use client";

import { m, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useCapability } from "@/lib/capability";

/*
 * Tilt — a pointer-reactive 3D surface (§ interactive previews). The card rotates
 * subtly toward the cursor with spring damping, and publishes --tilt-x / --tilt-y
 * (-1..1) so children can parallax against it for real depth. A soft glare tracks
 * the pointer. Everything is transform/opacity only.
 *
 * Disabled on touch / reduced motion / low-capability — it renders a plain static
 * wrapper there, so it's an enhancement, never a dependency.
 */
export function Tilt({
  children,
  className,
  style,
  max = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Max rotation in degrees. Kept small — this should read as depth, not spin. */
  max?: number;
  glare?: boolean;
}) {
  const reduced = useReducedMotion();
  const { finePointer, ready } = useCapability();
  const enabled = ready && finePointer && !reduced;

  const ref = useRef<HTMLDivElement>(null);
  // Normalised pointer position within the card, -0.5..0.5.
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const snx = useSpring(nx, { stiffness: 150, damping: 18, mass: 0.4 });
  const sny = useSpring(ny, { stiffness: 150, damping: 18, mass: 0.4 });

  const rotateY = useTransform(snx, (v) => v * max);
  const rotateX = useTransform(sny, (v) => -v * max);
  // CSS vars so children can parallax against the tilt.
  const tiltXVar = useTransform(snx, (v) => v.toFixed(3));
  const tiltYVar = useTransform(sny, (v) => v.toFixed(3));
  // Glare that tracks the pointer across the surface.
  const glareX = useTransform(snx, (v) => `${50 + v * 100}%`);
  const glareY = useTransform(sny, (v) => `${50 + v * 100}%`);
  const glareBg = useTransform(
    [glareX, glareY],
    ([gx, gy]: string[]) =>
      `radial-gradient(60% 60% at ${gx} ${gy}, rgba(255,255,255,0.28), transparent 60%)`,
  );

  const onMove = (e: React.PointerEvent) => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    nx.set((e.clientX - r.left) / r.width - 0.5);
    ny.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    nx.set(0);
    ny.set(0);
  };

  if (!enabled) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div style={{ perspective: 1000 }}>
      <m.div
        ref={ref}
        className={className}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{
          ...style,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          // Expose normalised pointer for children parallax.
          ["--tilt-x" as string]: tiltXVar,
          ["--tilt-y" as string]: tiltYVar,
          willChange: "transform",
        }}
      >
        {children}
        {glare && (
          <m.span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              pointerEvents: "none",
              background: glareBg,
              mixBlendMode: "soft-light",
            }}
          />
        )}
      </m.div>
    </div>
  );
}
