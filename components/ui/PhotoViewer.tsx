"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import type { Photo } from "@/content/types";
import { createLiquid, type LiquidController } from "@/lib/liquid";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * PhotoViewer — a fullscreen lightbox with liquid WebGL displacement transitions
 * between photographs. Opened from the gallery; arrow keys / on-screen controls
 * move between images, each swap melting into the next.
 *
 * Portaled to <body> (fixed positioning must be viewport-relative). Reduced
 * motion or missing WebGL → a clean opacity crossfade instead. Background scroll
 * locks while open; Escape closes.
 */
export function PhotoViewer({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const reduced = useReducedMotion();
  const open = index !== null;

  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<LiquidController | null>(null);
  // Attempt WebGL unless the user prefers reduced motion; only drop to the
  // crossfade if GL actually fails to initialise. (reduced resolves from its
  // safe `true` default on mount, so derive this each render rather than
  // freezing it into state — otherwise the canvas would never mount.)
  const [glFailed, setGlFailed] = useState(false);
  const useGL = !reduced && !glFailed;
  const lastIndex = useRef<number | null>(null);

  // Fresh WebGL attempt each time the viewer opens.
  useEffect(() => {
    if (open) setGlFailed(false);
  }, [open]);

  const go = useCallback(
    (dir: number) => {
      if (index === null) return;
      onNavigate((index + dir + photos.length) % photos.length);
    },
    [index, onNavigate, photos.length],
  );

  // Scroll lock + keyboard while open.
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("scroll-locked");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("scroll-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, go]);

  // Create / tear down the WebGL renderer with the overlay. Doesn't depend on
  // index, so navigating never recreates it — it just transitions.
  useEffect(() => {
    if (!open || !useGL) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = createLiquid(canvas);
    if (!c.ok) {
      setGlFailed(true); // fall back to the crossfade
      return;
    }
    controllerRef.current = c;
    void c.show(photos[index!].src);
    lastIndex.current = index;
    const onResize = () => c.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      c.destroy();
      controllerRef.current = null;
      lastIndex.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, useGL]);

  // Transition on navigation (GL mode). Fallback mode animates via AnimatePresence.
  useEffect(() => {
    if (!open || !useGL) return;
    const c = controllerRef.current;
    if (!c || !c.ok) return;
    if (lastIndex.current === null) {
      lastIndex.current = index;
      return;
    }
    if (index !== lastIndex.current) {
      lastIndex.current = index;
      // Preload neighbours so the next swap is instant.
      void c.transitionTo(photos[index!].src).then(() => {
        const n = (index! + 1) % photos.length;
        const p = (index! - 1 + photos.length) % photos.length;
        void c.prepare(photos[n].src);
        void c.prepare(photos[p].src);
      });
    }
  }, [index, open, useGL, photos]);

  if (!host) return null;
  const photo = index !== null ? photos[index] : null;

  return createPortal(
    <AnimatePresence>
      {open && photo && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label="Photograph viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.15 : 0.4 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: "var(--z-overlay)" as unknown as number,
            background: "var(--dark-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* GL canvas OR fallback image crossfade */}
          {useGL ? (
            <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          ) : (
            <AnimatePresence mode="popLayout">
              <m.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0.15 : 0.5 }}
                style={{ position: "absolute", inset: "5%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="100vw"
                  style={{ objectFit: "contain" }}
                  priority
                />
              </m.div>
            </AnimatePresence>
          )}

          {/* Controls */}
          <ViewerButton label="Close viewer" onClick={onClose} style={{ top: 20, right: 20 }}>
            ✕
          </ViewerButton>
          <ViewerButton label="Previous photograph" onClick={() => go(-1)} style={{ left: 20, top: "50%", transform: "translateY(-50%)" }}>
            ‹
          </ViewerButton>
          <ViewerButton label="Next photograph" onClick={() => go(1)} style={{ right: 20, top: "50%", transform: "translateY(-50%)" }}>
            ›
          </ViewerButton>

          {/* Caption + counter */}
          <div
            style={{
              position: "absolute",
              bottom: 24,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-3)",
              color: "var(--dark-text-secondary)",
              pointerEvents: "none",
            }}
          >
            {photo.place && <span className="type-caption" style={{ color: "var(--dark-text-secondary)" }}>{photo.place}</span>}
            <span className="type-caption" style={{ color: "var(--dark-text-tertiary)" }}>
              {index! + 1} / {photos.length}
            </span>
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    host,
  );
}

function ViewerButton({
  children,
  label,
  onClick,
  style,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  style: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        position: "absolute",
        zIndex: 2,
        width: 46,
        height: 46,
        borderRadius: "999px",
        border: "1px solid var(--dark-border)",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "var(--dark-text-primary)",
        fontSize: 20,
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
