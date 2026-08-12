"use client";

import { useEffect, useRef } from "react";

/*
 * ScreenshotGuard — a best-effort screenshot deterrent.
 *
 * Honest caveat: a web page CANNOT truly block screenshots. The capture happens
 * in the OS (or the phone) below the browser, so macOS Cmd+Shift+3/4, the
 * Windows Snipping Tool drag, and phone screenshots are all invisible to us and
 * unstoppable. What we CAN do is react to the capture *keys* the browser sees:
 *   • the instant PrintScreen / Win(⌘)+Shift+S is pressed, throw an opaque
 *     shield over the whole page so a key-triggered grab catches the shield, and
 *   • overwrite the clipboard so a PrintScreen paste comes out blank.
 * It does nothing during normal browsing.
 */
export function ScreenshotGuard() {
  const shieldRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const shield = shieldRef.current;
    if (!shield) return;

    const show = () => {
      shield.style.opacity = "1";
      shield.style.pointerEvents = "auto";
    };
    const hideSoon = (ms: number) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        shield.style.opacity = "0";
        shield.style.pointerEvents = "none";
      }, ms);
    };

    // Replace whatever PrintScreen just copied with nothing — a blank paste.
    const wipeClipboard = () => {
      try {
        navigator.clipboard?.writeText?.("").catch(() => {});
      } catch {
        /* clipboard not available / not focused — ignore */
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      const isPrint = k === "PrintScreen" || k === "Snapshot";
      const isSnip =
        (k === "s" || k === "S") && e.shiftKey && (e.metaKey || e.ctrlKey);
      if (!isPrint && !isSnip) return;
      show();
      // Let the OS finish its copy, then blank the clipboard.
      window.setTimeout(wipeClipboard, 120);
      hideSoon(1600);
    };

    // Capture phase + both key phases: PrintScreen often only emits keyup.
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      ref={shieldRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "#050507",
        color: "#f4f4f6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        textAlign: "center",
        padding: "24px",
        opacity: 0,
        pointerEvents: "none",
        // No fade-in: the shield must appear instantly to beat the capture.
        transition: "none",
      }}
    >
      <span
        style={{
          fontFamily:
            'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
          fontSize: "12px",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "rgba(255,92,92,0.92)",
        }}
      >
        ◉ Capture blocked
      </span>
      <span
        style={{
          fontSize: "clamp(22px, 4vw, 40px)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        Screenshots are disabled.
      </span>
    </div>
  );
}
