"use client";

import { useEffect, useState } from "react";
import { Sigil } from "@/components/ui/Sigil";
import { visitorIdentity } from "@/lib/visitor";

/*
 * FooterSigil — every visitor's personal constellation, shown once they reach
 * the foot of the page. Deterministic from their device signals, so it's the
 * same mark on every visit. Client-only (identity depends on screen/timezone),
 * so it renders nothing until mounted to avoid a hydration mismatch.
 */
export function FooterSigil() {
  const [id, setId] = useState<{ id: number; seed: number } | null>(null);
  useEffect(() => setId(visitorIdentity()), []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 56,
        marginTop: "var(--space-6)",
      }}
    >
      {id && <Sigil seed={id.seed} size={56} />}
      <div>
        <p className="type-caption" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
          Your mark
        </p>
        <p
          className="type-caption"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.05em" }}
        >
          {id ? `#${id.id.toString().padStart(5, "0")} · one of a kind` : " "}
        </p>
      </div>
    </div>
  );
}
