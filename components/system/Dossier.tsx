"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { readSituation, type Situation } from "@/lib/situation";
import { rhythmInsight } from "@/lib/rhythm";
import { inferVisitorType } from "@/lib/visitorType";
import { getMood } from "@/lib/behaviorPulse";
import { topSection } from "@/lib/engagement";
import { readVisit } from "@/lib/visitor";
import { CANBERRA, haversineKm, compass8, bearingDeg } from "@/lib/geo";
import { visitorLocation } from "@/lib/sky";

/*
 * Dossier — "What I've noticed about you". Opened from the footer (a window
 * event), it gathers every on-device inference — your situation, your rhythm,
 * why you seem to be here, what holds you, and what your own hand is giving away
 * — and holds the mirror up. Nothing here has ever left the browser, and it says
 * so. This is the site knowing you, quietly.
 */

interface Line {
  k: string;
  v: string;
}

export function Dossier() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [situation, setSituation] = useState<Situation | null>(null);
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("coen:dossier", onOpen);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("coen:dossier", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const gathered: Line[] = [];

    const vtype = inferVisitorType();
    gathered.push({ k: "Why you seem here", v: vtype.line });

    const rhythm = rhythmInsight();
    if (rhythm) gathered.push({ k: "Your rhythm", v: rhythm });

    const top = topSection();
    if (top) gathered.push({ k: "What holds you", v: `You spend the most time in ${top.label}.` });

    gathered.push({ k: "How you're moving", v: `Right now, ${getMood().label}.` });

    const visit = readVisit();
    if (visit && visit.count > 1) gathered.push({ k: "History", v: `This is visit number ${visit.count}.` });

    const loc = visitorLocation();
    if (loc.known && loc.lat != null) {
      const here = { lat: loc.lat, lng: loc.lng };
      const km = Math.round(haversineKm(here, CANBERRA) / 10) * 10;
      gathered.push({
        k: "Distance from Coen",
        v: `About ${km.toLocaleString()} km, off to the ${compass8(bearingDeg(here, CANBERRA))}.`,
      });
    }

    setLines(gathered);
    readSituation().then(setSituation);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label="What this site has noticed about you"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.15 : 0.35 }}
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--margin-mobile)",
            background: "rgba(10,10,14,0.42)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
          }}
        >
          <m.div
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reduced ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "min(520px, 100%)",
              maxHeight: "82vh",
              overflowY: "auto",
              background: "var(--surface-solid)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.28)",
              padding: "var(--space-5)",
            }}
          >
            <p
              className="type-caption"
              style={{ color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "var(--space-2)" }}
            >
              What I&rsquo;ve noticed about you
            </p>

            {situation && (
              <p
                className="type-h3"
                style={{ fontWeight: 400, lineHeight: 1.35, marginBottom: "var(--space-4)", color: "var(--text-primary)" }}
              >
                {situation.sentence}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {lines.map((l) => (
                <div key={l.k}>
                  <p className="type-caption" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                    {l.k}
                  </p>
                  <p className="type-body" style={{ color: "var(--text-secondary)" }}>
                    {l.v}
                  </p>
                </div>
              ))}
            </div>

            {situation && situation.facts.length > 0 && (
              <div
                style={{
                  marginTop: "var(--space-4)",
                  paddingTop: "var(--space-3)",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 8px",
                }}
              >
                {situation.facts.map((f) => (
                  <span
                    key={f.label}
                    className="type-caption"
                    title={f.label}
                    style={{
                      color: "var(--text-tertiary)",
                      background: "rgba(0,0,0,0.04)",
                      borderRadius: "999px",
                      padding: "4px 10px",
                    }}
                  >
                    {f.value}
                  </span>
                ))}
              </div>
            )}

            <p
              className="type-caption"
              style={{ marginTop: "var(--space-4)", color: "var(--text-tertiary)", lineHeight: 1.5 }}
            >
              Every word of this was worked out on your device and has never been sent anywhere.
              Close this and it&rsquo;s gone.
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              data-cursor="interactive"
              style={{
                marginTop: "var(--space-4)",
                padding: "9px 18px",
                borderRadius: "999px",
                border: "1px solid var(--border-strong)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "var(--fs-caption)",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
