import Link from "next/link";
import type { Profile } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { stagger } from "@/lib/motion";

/*
 * AboutGlimpse — a short landing teaser of the About page, not the whole thing.
 * One or two lines, then a link out. Keeps the landing curated (§ "don't dump
 * everything there"). Server component.
 */
export function AboutGlimpse({ profile }: { profile: Profile }) {
  const lines = profile.about
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);

  return (
    <section aria-labelledby="about-glimpse-title" className="scene">
      <div className="scene-inner" style={{ maxWidth: "40ch" }}>
        <Reveal>
          <p className="type-caption" style={{ marginBottom: "var(--space-3)" }}>
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>—</span> ABOUT
          </p>
        </Reveal>
        <h2
          id="about-glimpse-title"
          className="type-h2"
          style={{ fontSize: "clamp(28px, 4vw, 52px)", marginBottom: "var(--space-4)" }}
        >
          {lines.map((line, i) => (
            <Reveal key={i} as="span" delay={stagger.line(i)} style={{ display: "block" }}>
              {line}
            </Reveal>
          ))}
        </h2>
        <Reveal delay={0.12}>
          <Link
            href="/about"
            data-cursor="interactive"
            className="type-body"
            style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
          >
            More about me →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
