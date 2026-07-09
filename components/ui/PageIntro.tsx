import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/*
 * PageIntro — the h1 header each dedicated route opens with. Big, editorial,
 * consistent rhythm. Gives every page a single semantic h1 (the reused scene
 * bodies below it render with their internal headers suppressed).
 */
export function PageIntro({
  index,
  title,
  lead,
  dark,
}: {
  index: string;
  title: string;
  lead?: ReactNode;
  dark?: boolean;
}) {
  const primary = dark ? "var(--dark-text-primary)" : "var(--text-primary)";
  const tertiary = dark ? "var(--dark-text-tertiary)" : "var(--text-tertiary)";

  return (
    <header
      className="scene-inner"
      style={{ paddingTop: "var(--space-9)", marginBottom: "var(--space-4)" }}
    >
      <Reveal>
        <p
          className="type-caption"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-3)",
            color: tertiary,
          }}
        >
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>{index}</span>
          <span
            aria-hidden
            style={{
              width: 28,
              height: 1,
              background: dark ? "var(--dark-border)" : "var(--border-strong)",
              display: "inline-block",
            }}
          />
          <span style={{ textTransform: "uppercase" }}>Coen · coen.life</span>
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <h1 className="type-h1" style={{ color: primary, fontSize: "clamp(48px, 9vw, 120px)" }}>
          {title}
        </h1>
      </Reveal>
      {lead && (
        <Reveal delay={0.12}>
          <p
            className="type-h3"
            style={{
              color: dark ? "var(--dark-text-secondary)" : "var(--text-secondary)",
              fontWeight: 400,
              maxWidth: "28ch",
              marginTop: "var(--space-3)",
            }}
          >
            {lead}
          </p>
        </Reveal>
      )}
    </header>
  );
}
