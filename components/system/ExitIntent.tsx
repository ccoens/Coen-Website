"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { useCapability } from "@/lib/capability";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { readEngagement } from "@/lib/engagement";

/*
 * ExitIntent — the moment the cursor slips off the top of the window to leave,
 * the site makes ONE quiet, personalised gesture toward the most worth-seeing
 * thing the visitor never opened (from their on-device dwell). Not a generic
 * popup — it points at exactly what they missed. Once per session; desktop only.
 */

interface Hook {
  name: string;
  href: string;
  line: string;
}

// Ordered by pull — we offer the first one they haven't really seen.
const HOOKS: Hook[] = [
  { name: "photography", href: "/photography", line: "you never saw the photography." },
  { name: "projects", href: "/projects", line: "you haven't opened the work yet." },
  { name: "travel", href: "/travel", line: "you missed the map — 30 countries." },
  { name: "journal", href: "/journal", line: "there's writing here you haven't read." },
];

const SEEN_MS = 3000;
const SESSION_KEY = "coen.exit.v1";

export function ExitIntent() {
  const { finePointer, ready } = useCapability();
  const reduced = useReducedMotion();
  const [hook, setHook] = useState<Hook | null>(null);

  useEffect(() => {
    if (!ready || !finePointer) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* ignore */
    }

    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      if (e.clientY > 0) return; // only when leaving via the top
      const eng = readEngagement();
      const h = HOOKS.find((x) => (eng.sections[x.name] ?? 0) < SEEN_MS);
      if (!h) return; // they've seen what matters — let them go
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setHook(h);
      document.removeEventListener("mouseout", onOut);
    };

    document.addEventListener("mouseout", onOut);
    return () => document.removeEventListener("mouseout", onOut);
  }, [ready, finePointer]);

  useEffect(() => {
    if (!hook) return;
    const t = window.setTimeout(() => setHook(null), 9000);
    return () => window.clearTimeout(t);
  }, [hook]);

  return (
    <AnimatePresence>
      {hook && (
        <m.div
          role="status"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -18 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: reduced ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            top: "var(--space-3)",
            left: "50%",
            x: "-50%",
            zIndex: 95,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderRadius: "999px",
            background: "var(--surface-solid)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 14px 40px rgba(0,0,0,0.16)",
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          <span className="type-caption" style={{ color: "var(--text-secondary)" }}>
            Before you go — {hook.line}
          </span>
          <Link
            href={hook.href}
            onClick={() => setHook(null)}
            data-cursor="interactive"
            className="type-caption"
            style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Take a look ↗
          </Link>
        </m.div>
      )}
    </AnimatePresence>
  );
}
