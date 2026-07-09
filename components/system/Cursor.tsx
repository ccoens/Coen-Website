"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useCapability } from "@/lib/capability";

/*
 * Cursor — the physics orb that replaces the native cursor on fine pointers
 * (§10). It is deliberately DELAYED (spring lag ~120–180ms), never instant —
 * that lag is the whole "it has mass" feel.
 *
 * States: over interactive → grow + brighten, with a slight velocity stretch;
 * press → compress then spring rebound; over an image → morph to a lens ring
 * (the hovered image scales itself via CSS; the cursor becomes the frame).
 *
 * Not mounted on touch or under reduced motion (returns null) — the native
 * cursor stays. body[data-custom-cursor] (set in AppShell) hides the native one.
 */

type CursorState = "default" | "interactive" | "image";

export function Cursor() {
  const { finePointer, reducedMotion, ready } = useCapability();

  // Raw pointer position; springs give it lag + inertia (§10 stiffness ~140).
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 150, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 150, damping: 18, mass: 0.6 });

  // Velocity-driven stretch, springed so it eases back to round when still.
  const stretch = useMotionValue(0);
  const sStretch = useSpring(stretch, { stiffness: 120, damping: 20 });
  // Map stretch → scale factors: elongate along travel, thin across it.
  const scaleXMV = useTransform(sStretch, (v) => 1 + v);
  const scaleYMV = useTransform(sStretch, (v) => 1 - v * 0.5);
  const angle = useMotionValue(0);

  const [state, setState] = useState<CursorState>("default");
  const [pressed, setPressed] = useState(false);
  const last = useRef({ x: 0, y: 0, t: 0 });

  const active = ready && finePointer && !reducedMotion;

  useEffect(() => {
    if (!active) return;

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);

      // Derive speed → a small directional stretch (max ~0.18).
      const now = performance.now();
      const dt = Math.max(now - last.current.t, 1);
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      const speed = Math.hypot(dx, dy) / dt;
      stretch.set(Math.min(speed * 0.08, 0.18));
      if (speed > 0.05) angle.set((Math.atan2(dy, dx) * 180) / Math.PI);
      last.current = { x: e.clientX, y: e.clientY, t: now };

      // Classify what's under the cursor for the state morph.
      const el = e.target as Element | null;
      if (el?.closest('[data-cursor="image"], img')) setState("image");
      else if (el?.closest('a, button, [data-cursor="interactive"], input, textarea'))
        setState("interactive");
      else setState("default");
    };

    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => {
      x.set(-100);
      y.set(-100);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [active, x, y, stretch, angle]);

  if (!active) return null;

  const baseSize = 20; // 18–24px
  const scale =
    state === "image" ? 2.6 : state === "interactive" ? 1.8 : 1;
  // Press compresses vertically 12% then springs back (§10).
  const pressY = pressed ? 0.88 : 1;
  const isLens = state === "image";

  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: baseSize,
        height: baseSize,
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: "var(--z-cursor)" as unknown as number,
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        rotate: angle,
        // Stretch along travel direction (perpendicular thins slightly).
        scaleX: scaleXMV,
        scaleY: scaleYMV,
        mixBlendMode: "normal",
      }}
    >
      <motion.div
        animate={{
          scale: scale,
          scaleY: pressY,
          opacity: 1,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          // Lens: a ring with a hollow centre. Default: soft glowing orb tinted
          // by the live accent, dark-cored so it reads on the off-white field.
          background: isLens
            ? "transparent"
            : "radial-gradient(circle at 35% 30%, hsl(var(--accent-h) 40% 55% / 0.9), hsl(var(--accent-h) 40% 40% / 0.35) 70%)",
          border: isLens
            ? "1.5px solid hsl(var(--accent-h) 45% 55% / 0.9)"
            : "none",
          boxShadow: isLens
            ? "0 0 18px hsl(var(--accent-h) 45% 60% / 0.35)"
            : "0 0 14px hsl(var(--accent-h) 45% 60% / 0.4)",
        }}
      />
    </motion.div>
  );
}
