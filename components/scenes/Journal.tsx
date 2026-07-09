import type { JournalEntry } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { SceneHeader } from "@/components/ui/SceneHeader";

/*
 * Journal scene (§13). Single column, max 620px, no borders — separation is
 * spacing alone. Thoughts, not blog posts. Each entry softly fades + rises.
 * Server component.
 */
export function Journal({
  entries,
  hideHeader = false,
}: {
  entries: JournalEntry[];
  hideHeader?: boolean;
}) {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <section id="journal" className="scene" aria-labelledby="journal-title">
      <div className="scene-inner">
        {!hideHeader && (
          <SceneHeader
            index="04"
            title="Journal"
            id="journal-title"
            lead="Notes to self, in the open."
          />
        )}

        <div style={{ maxWidth: 620 }}>
          {sorted.map((entry, i) => (
            <Reveal
              key={entry.id}
              delay={i * 0.04}
              as="article"
              style={{ marginBottom: "var(--space-7)" }}
            >
              <time
                className="type-caption"
                dateTime={entry.date}
                style={{ display: "block", marginBottom: "var(--space-1)" }}
              >
                {fmt(entry.date)}
              </time>
              <h3 className="type-h3" style={{ marginBottom: "var(--space-2)" }}>
                {entry.title}
              </h3>
              <p className="type-body" style={{ color: "var(--text-secondary)" }}>
                {entry.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
