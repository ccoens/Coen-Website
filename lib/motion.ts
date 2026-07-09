/*
 * motion.ts — the single source for springs, easings and variants (§8, §16).
 * No motion config lives anywhere else. If two components animate the "same
 * way", they import the same export from here.
 *
 * Rule of the build: motion behaves like physics (inertia, damping, decay) and
 * must never be *noticeable*. Springs below approximate --ease-primary with no
 * visible overshoot.
 */

import type { SpringOptions, Transition, Variants } from "framer-motion";

/* ---- Easings (mirror styles/tokens.css) ------------------------------ */
export const easePrimary = [0.22, 1, 0.36, 1] as const;
export const easeAmbient = [0.25, 0.8, 0.25, 1] as const;
export const easeExit = [0.4, 0, 0.2, 1] as const;

/* ---- Springs (§8) ---------------------------------------------------- */
export const springSettle: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 26,
  mass: 1,
};
export const springCursor: Transition = {
  type: "spring",
  stiffness: 140,
  damping: 18,
  mass: 0.6,
};
export const springSoft: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 22,
};

/*
 * SpringOptions variants for useSpring() (which takes bare spring config, not a
 * Transition). Same physics as the transitions above, without `type`.
 */
export const springSettleOptions: SpringOptions = {
  stiffness: 180,
  damping: 26,
  mass: 1,
};
export const springCursorOptions: SpringOptions = {
  stiffness: 140,
  damping: 18,
  mass: 0.6,
};
export const springSoftOptions: SpringOptions = {
  stiffness: 120,
  damping: 22,
};

/* ---- Durations (seconds, for Framer) --------------------------------- */
export const dur = {
  micro: 0.15,
  ui: 0.42,
  section: 1.0,
} as const;

/*
 * Reveal variants — fade + rise. The distance is small on purpose; if a viewer
 * notices the rise, it's wrong. `custom` carries a per-item delay (used for the
 * line/letter stagger in About and elsewhere).
 */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...springSettle, delay },
  }),
};

/* Reduced-motion reveal: pure opacity, no transform, near-instant (§17). */
export const revealVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.2, delay: Math.min(delay, 0.2), ease: easeAmbient },
  }),
};

/* Shared viewport config so every reveal fires at a consistent threshold. */
export const revealViewport = { once: true, amount: 0.35, margin: "0px 0px -10% 0px" } as const;

/*
 * Stagger helpers. Spec calls for 40ms line stagger (About) and per-item
 * cascades; expose them as functions so scenes never hard-code timings.
 */
export const stagger = {
  line: (i: number) => i * 0.04, // 40ms
  item: (i: number) => i * 0.08, // 80ms
} as const;
