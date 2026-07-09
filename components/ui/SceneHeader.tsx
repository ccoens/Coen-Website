import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/*
 * SceneHeader — the consistent index + title block that opens each section.
 * Server-safe wrapper; the reveal inside is the shared client primitive. Keeps
 * every scene's opening rhythm identical (§3 vertical rhythm, §5 type scale).
 */
export function SceneHeader({
  index,
  title,
  id,
  lead,
}: {
  index?: string;
  title: string;
  id?: string;
  lead?: ReactNode;
}) {
  return (
    <header style={{ marginBottom: "var(--space-6)" }}>
      <Reveal>
        <p
          className="type-caption"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-2)",
          }}
        >
          {index && (
            <span aria-hidden style={{ color: "var(--accent)", fontWeight: 600 }}>
              {index}
            </span>
          )}
          <span
            aria-hidden
            style={{
              width: 28,
              height: 1,
              background: "var(--border-strong)",
              display: "inline-block",
            }}
          />
          <span style={{ textTransform: "uppercase" }}>{title}</span>
        </p>
      </Reveal>
      {lead && (
        <Reveal delay={0.06}>
          <h2 id={id} className="type-h2" style={{ maxWidth: "18ch" }}>
            {lead}
          </h2>
        </Reveal>
      )}
    </header>
  );
}
