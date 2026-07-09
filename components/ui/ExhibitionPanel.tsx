"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { m, AnimatePresence, type Transition } from "framer-motion";
import type { Project } from "@/content/types";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useCapability } from "@/lib/capability";

/*
 * ExhibitionPanel + ProjectExpansion (§13). Projects are glass exhibition
 * panels, not cards. Hover lifts the panel 6–12px and deepens its shadow. Click
 * expands the project IN PLACE — a shared-layout (layoutId) morph into a
 * full-screen immersive view, no page load, no remount. The cover image and
 * title are the shared elements, so the panel appears to grow into the reader.
 *
 * Reduced motion collapses the morph to a quick cross-fade (no travel).
 */

const springLayout: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 30,
};

export function ExhibitionPanel({
  project,
  onOpen,
  isActive,
}: {
  project: Project;
  onOpen: (id: string) => void;
  isActive: boolean;
}) {
  const reduced = useReducedMotion();
  const { canBlur, ready } = useCapability();
  const useBlur = ready && canBlur;

  return (
    <m.button
      type="button"
      onClick={() => onOpen(project.id)}
      aria-label={`Open ${project.title}`}
      whileHover={reduced ? undefined : { y: -10 }}
      transition={springLayout}
      style={{
        display: "block",
        textAlign: "left",
        width: "100%",
        padding: 0,
        border: "none",
        background: "transparent",
        borderRadius: "var(--radius-lg)",
        // Hidden while its expansion is open so the shared layout isn't doubled.
        visibility: isActive ? "hidden" : "visible",
      }}
    >
      <m.div
        layoutId={`panel-${project.id}`}
        transition={springLayout}
        style={{
          position: "relative",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--border)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.07)",
          background: useBlur ? "var(--surface)" : "var(--surface-solid)",
          backdropFilter: useBlur ? "blur(14px) saturate(1.3)" : undefined,
          WebkitBackdropFilter: useBlur ? "blur(14px) saturate(1.3)" : undefined,
        }}
      >
        <m.div
          layoutId={`cover-${project.id}`}
          data-cursor="image"
          style={{ position: "relative", aspectRatio: "16 / 10", overflow: "hidden" }}
        >
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            fill
            sizes="(max-width: 900px) 100vw, 45vw"
            style={{ objectFit: "cover" }}
          />
        </m.div>

        <div style={{ padding: "var(--space-3)" }}>
          <m.h3
            layoutId={`title-${project.id}`}
            className="type-h3"
            style={{ marginBottom: "var(--space-1)" }}
          >
            {project.title}
          </m.h3>
          <p className="type-caption">
            {project.year} · {project.role}
          </p>
        </div>
      </m.div>
    </m.button>
  );
}

export function ProjectExpansion({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const { canBlur, ready } = useCapability();
  const useBlur = ready && canBlur;
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Lock background scroll, wire Escape, and manage focus while open (§17).
  useEffect(() => {
    if (!project) return;
    document.documentElement.classList.add("scroll-locked");
    // Remember what was focused so we can restore it on close.
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    // Move focus into the dialog once it has mounted.
    const raf = requestAnimationFrame(() => closeRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("scroll-locked");
      window.removeEventListener("keydown", onKey);
      // Restore focus to the panel that opened this expansion.
      returnFocusRef.current?.focus?.();
    };
  }, [project, onClose]);

  const transition = reduced
    ? { duration: 0.15 }
    : springLayout;

  return (
    <AnimatePresence>
      {project && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label={project.title}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            justifyContent: "center",
            overflowY: "auto",
            padding: "clamp(16px, 5vh, 64px) var(--margin-mobile)",
          }}
        >
          {/* Backdrop — fades independently of the shared-layout morph. */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.4 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(20,20,22,0.32)",
              backdropFilter: useBlur ? "blur(6px)" : undefined,
              WebkitBackdropFilter: useBlur ? "blur(6px)" : undefined,
            }}
          />

          <m.article
            layoutId={`panel-${project.id}`}
            transition={transition}
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(1000px, 100%)",
              height: "fit-content",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              border: "1px solid var(--border-strong)",
              boxShadow: "0 40px 120px rgba(0,0,0,0.24)",
              background: useBlur ? "var(--surface)" : "var(--surface-solid)",
              backdropFilter: useBlur ? "blur(24px) saturate(1.4)" : undefined,
              WebkitBackdropFilter: useBlur ? "blur(24px) saturate(1.4)" : undefined,
            }}
          >
            <m.div
              layoutId={`cover-${project.id}`}
              style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden" }}
            >
              <Image
                src={project.cover.src}
                alt={project.cover.alt}
                fill
                sizes="(max-width: 1000px) 100vw, 1000px"
                style={{ objectFit: "cover" }}
                priority
              />
            </m.div>

            <div style={{ padding: "var(--space-5)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-3)",
                }}
              >
                <div>
                  <m.h3
                    layoutId={`title-${project.id}`}
                    className="type-h2"
                    style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
                  >
                    {project.title}
                  </m.h3>
                  <p className="type-caption" style={{ marginTop: "var(--space-1)" }}>
                    {project.year} · {project.role}
                  </p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close project"
                  style={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    borderRadius: "999px",
                    border: "1px solid var(--border-strong)",
                    background: "var(--surface-solid)",
                    fontSize: 18,
                    lineHeight: 1,
                    color: "var(--text-primary)",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Body content fades in after the morph settles. */}
              <m.div
                initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduced ? 0 : 0.15, duration: 0.5 }}
              >
                <p
                  className="type-body"
                  style={{
                    maxWidth: "62ch",
                    color: "var(--text-secondary)",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  {project.summary}
                </p>

                {project.href && (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    className="type-body"
                    style={{
                      color: "var(--accent)",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    Visit project ↗
                  </a>
                )}

                {project.gallery && project.gallery.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gap: "var(--space-3)",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      marginTop: "var(--space-5)",
                    }}
                  >
                    {project.gallery.map((g, i) => (
                      <div
                        key={i}
                        data-cursor="image"
                        style={{
                          position: "relative",
                          borderRadius: "var(--radius-md)",
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                          aspectRatio: `${g.width} / ${g.height}`,
                        }}
                      >
                        <Image
                          src={g.src}
                          alt={g.alt}
                          fill
                          sizes="(max-width: 900px) 100vw, 480px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </m.div>
            </div>
          </m.article>
        </m.div>
      )}
    </AnimatePresence>
  );
}
