"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * Perceptive — the site notices how you're moving and responds with a quiet
 * whisper. Rest a while and it tells you to take your time; scan back and forth
 * as if lost and it points you to the nav; reach the very end and it thanks you.
 * Each whisper fires at most once per visit and never crowds another — restraint
 * is what makes it feel perceptive rather than chatty.
 */

const IDLE_MS = 22_000;

export function Perceptive() {
  const reduced = useReducedMotion();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const shown = new Set<string>();
    let lastAt = 0;
    let hideTimer = 0;
    let idleTimer = 0;

    const whisper = (type: string, text: string) => {
      const now = Date.now();
      if (shown.has(type) || now - lastAt < 40_000) return;
      shown.add(type);
      lastAt = now;
      setMsg(text);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setMsg(null), 5200);
    };

    // Idle → "take your time".
    const armIdle = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => whisper("idle", "Take your time."), IDLE_MS);
    };
    const onActivity = () => armIdle();

    // Scroll direction reversals within a short window → "looking for something?"
    let lastY = window.scrollY;
    let lastDir = 0;
    const reversals: number[] = [];
    const onScroll = () => {
      const y = window.scrollY;
      const dir = Math.sign(y - lastY);
      lastY = y;
      if (dir !== 0 && dir !== lastDir && lastDir !== 0) {
        const now = performance.now();
        reversals.push(now);
        while (reversals.length && now - reversals[0] > 4000) reversals.shift();
        if (reversals.length >= 4) whisper("lost", "Looking for something? The nav's up top.");
      }
      if (dir !== 0) lastDir = dir;

      // Reached the very bottom of a long page → "thanks for reading".
      if (
        document.documentElement.scrollHeight > window.innerHeight * 1.6 &&
        y + window.innerHeight >= document.documentElement.scrollHeight - 4
      ) {
        whisper("end", "That's the end of the scroll — thanks for staying.");
      }
      armIdle();
    };

    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onScroll, { passive: true });
    armIdle();

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(idleTimer);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {msg && (
        <m.div
          role="status"
          aria-live="polite"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: reduced ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            left: "50%",
            bottom: "calc(var(--space-4))",
            transform: "translateX(-50%)",
            zIndex: 88,
            pointerEvents: "none",
            padding: "9px 16px",
            borderRadius: "999px",
            fontSize: "var(--fs-caption)",
            color: "var(--text-secondary)",
            background: "var(--surface-solid)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            whiteSpace: "nowrap",
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          {msg}
        </m.div>
      )}
    </AnimatePresence>
  );
}
