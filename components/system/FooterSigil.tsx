"use client";

import { useEffect, useState } from "react";
import { Sigil } from "@/components/ui/Sigil";
import { visitorIdentity, readVisit } from "@/lib/visitor";

/*
 * FooterSigil — every visitor's personal constellation, shown once they reach
 * the foot of the page. The base shape is deterministic from their device (the
 * same mark every visit), and it GROWS: one extra star is added for each visit
 * they've made, so a returning visitor slowly draws a sky that's theirs alone.
 * Client-only (identity + visit count depend on the device), so it renders
 * nothing until mounted to avoid a hydration mismatch.
 */
export function FooterSigil() {
  const [state, setState] = useState<{ id: number; seed: number; visits: number } | null>(null);

  useEffect(() => {
    const { id, seed } = visitorIdentity();
    const visits = readVisit()?.count ?? 1;
    setState({ id, seed, visits });
  }, []);

  // Base of 4 stars, +1 per visit, capped so it stays a legible little mark.
  const count = state ? Math.min(4 + state.visits, 22) : 6;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 56,
      }}
    >
      {state && <Sigil seed={state.seed} size={56} count={count} />}
      <div>
        <p className="type-caption" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
          Your sky
        </p>
        <p
          className="type-caption"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.05em" }}
        >
          {state
            ? `#${state.id.toString().padStart(5, "0")} · ${state.visits} visit${state.visits === 1 ? "" : "s"}`
            : " "}
        </p>
      </div>
    </div>
  );
}
