"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { sigilStars } from "@/lib/visitor";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * Sigil — a visitor's one-of-one constellation, generated deterministically
 * from their seed (so it's the same mark every visit). Nodes connect into a
 * path that draws itself in on mount; ties into the site's star/sky motif.
 * Purely decorative — callers provide the accessible label around it.
 */
export function Sigil({
  seed,
  size = 72,
  animate = true,
  count = 6,
}: {
  seed: number;
  size?: number;
  animate?: boolean;
  /** Number of stars. Because sigilStars is a stable sequence, growing this
   *  keeps every earlier star and only appends new ones — a constellation that
   *  accumulates over return visits. */
  count?: number;
}) {
  const reduced = useReducedMotion();
  const stars = useMemo(() => sigilStars(seed, count), [seed, count]);
  const linePath = useMemo(
    () => stars.map((s, i) => `${i === 0 ? "M" : "L"} ${s.x.toFixed(1)} ${s.y.toFixed(1)}`).join(" "),
    [stars],
  );
  const play = animate && !reduced;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      style={{ display: "block", overflow: "visible" }}
    >
      <m.path
        d={linePath}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
        initial={play ? { pathLength: 0, opacity: 0 } : false}
        animate={play ? { pathLength: 1, opacity: 0.6 } : undefined}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
      {stars.map((s, i) => (
        <m.circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="var(--accent)"
          initial={play ? { scale: 0, opacity: 0 } : false}
          animate={play ? { scale: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: play ? 0.2 + i * 0.12 : 0, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: `${s.x}px ${s.y}px` }}
        />
      ))}
    </svg>
  );
}
