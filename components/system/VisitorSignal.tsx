"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Sigil } from "@/components/ui/Sigil";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  visitorIdentity,
  readVisit,
  writeVisit,
  elapsedLabel,
  type VisitRecord,
} from "@/lib/visitor";
import { photos } from "@/content/photos";
import { projects } from "@/content/projects";

/*
 * VisitorSignal — the returning-visitor "time capsule". On a return visit (more
 * than half an hour since the last), a quiet toast in the corner welcomes the
 * visitor back, notes how long it's been and anything new since, and shows their
 * personal sigil + number. First visits stay silent (we just record). All state
 * is localStorage; nothing leaves the device. Auto-dismisses, or on click.
 */

const RETURN_THRESHOLD_MS = 30 * 60 * 1000;

interface Capsule {
  elapsed: string;
  newPhotos: number;
  newProjects: number;
  id: number;
  seed: number;
}

export function VisitorSignal() {
  const reduced = useReducedMotion();
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const identity = visitorIdentity();
    const prior = readVisit();
    const now = Date.now();
    const photoCount = photos.length;
    const projectCount = projects.length;

    if (prior && now - prior.last > RETURN_THRESHOLD_MS) {
      setCapsule({
        elapsed: elapsedLabel(now - prior.last),
        newPhotos: Math.max(0, photoCount - prior.photos),
        newProjects: Math.max(0, projectCount - prior.projects),
        id: identity.id,
        seed: identity.seed,
      });
      setShow(true);
    }

    const next: VisitRecord = {
      first: prior?.first ?? now,
      last: now,
      count: (prior?.count ?? 0) + 1,
      photos: photoCount,
      projects: projectCount,
    };
    writeVisit(next);
  }, []);

  // Auto-dismiss after a while.
  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(() => setShow(false), 9000);
    return () => window.clearTimeout(t);
  }, [show]);

  if (!capsule) return null;

  const news: string[] = [];
  if (capsule.newPhotos > 0)
    news.push(`${capsule.newPhotos} new photo${capsule.newPhotos === 1 ? "" : "s"}`);
  if (capsule.newProjects > 0)
    news.push(`${capsule.newProjects} new project${capsule.newProjects === 1 ? "" : "s"}`);

  return (
    <AnimatePresence>
      {show && (
        <m.aside
          role="status"
          aria-live="polite"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(4px)" }}
          transition={{ duration: reduced ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setShow(false)}
          style={{
            position: "fixed",
            right: "calc(var(--margin-mobile, 20px))",
            bottom: "calc(var(--space-3))",
            zIndex: 90,
            maxWidth: "min(340px, calc(100vw - 40px))",
            display: "flex",
            gap: 14,
            alignItems: "center",
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-solid)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.14)",
            cursor: "pointer",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <Sigil seed={capsule.seed} size={56} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              className="type-caption"
              style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 3 }}
            >
              Welcome back
            </p>
            <p className="type-caption" style={{ color: "var(--text-secondary)", lineHeight: 1.45 }}>
              It&apos;s been {capsule.elapsed}
              {news.length > 0 ? ` — ${news.join(" and ")} since.` : "."}
            </p>
            <p
              className="type-caption"
              style={{ color: "var(--text-tertiary)", marginTop: 5, letterSpacing: "0.04em" }}
            >
              Your mark · #{capsule.id.toString().padStart(5, "0")}
            </p>
          </div>
        </m.aside>
      )}
    </AnimatePresence>
  );
}
