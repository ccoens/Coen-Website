"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * ScrambleText — a short label that "decodes" into place the first time it
 * scrolls into view: random glyphs settle left-to-right into the real text,
 * briefly tinted with the live accent, then revert to the inherited colour.
 * On-theme with the site's kinetic identity; used for the section eyebrows.
 *
 * Accessibility + SSR: the server renders the real text, so no-JS and screen
 * readers get the plain string (also mirrored via aria-label). The scramble is
 * seeded in a layout effect (before paint) so there's no flash of plain text
 * ahead of the animation. Under reduced motion it never scrambles.
 */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>#*·";
const FRAMES = 16; // ~16 * 42ms ≈ 0.7s to fully resolve
const FRAME_MS = 42;

function scrambleOf(text: string, revealCount = 0) {
  return text
    .split("")
    .map((c, i) =>
      c === " " ? " " : i < revealCount ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0],
    )
    .join("");
}

export function ScrambleText({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(text);
  const [active, setActive] = useState(false);

  // Seed the scrambled state before first paint so the real text never flashes.
  useLayoutEffect(() => {
    if (reduced) return;
    setDisplay(scrambleOf(text));
  }, [reduced, text]);

  useEffect(() => {
    if (reduced) {
      setDisplay(text);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let intervalId: number | undefined;
    const run = () => {
      setActive(true);
      let frame = 0;
      intervalId = window.setInterval(() => {
        frame += 1;
        const revealCount = Math.floor((frame / FRAMES) * text.length);
        setDisplay(scrambleOf(text, revealCount));
        if (frame >= FRAMES) {
          window.clearInterval(intervalId);
          setDisplay(text);
          setActive(false);
        }
      }, FRAME_MS);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [reduced, text]);

  return (
    <span
      ref={ref}
      className={className}
      aria-label={text}
      style={{
        color: active ? "var(--accent)" : undefined,
        transition: "color 450ms var(--ease-primary)",
        ...style,
      }}
    >
      <span aria-hidden>{display}</span>
    </span>
  );
}
