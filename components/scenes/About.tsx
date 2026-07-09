import Image from "next/image";
import type { Profile } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { ParallaxLayer } from "@/components/ui/ParallaxLayer";
import { stagger } from "@/lib/motion";

/*
 * About scene (§13). Split layout: text on the left revealing line-by-line with
 * a 40ms stagger, a portrait on the right drifting on parallax. Server
 * component — only the Reveal/Parallax leaves are client.
 */
export function About({
  profile,
  hideHeader = false,
}: {
  profile: Profile;
  hideHeader?: boolean;
}) {
  // Break the about copy into sentence-ish lines for the staggered reveal.
  const lines = profile.about
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section id="about" className="scene" aria-labelledby="about-title">
      <div className="scene-inner">
        {!hideHeader && <SceneHeader index="01" title="About" />}

        <div
          style={{
            display: "grid",
            gap: "var(--space-6)",
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
          className="about-grid"
        >
          <div style={{ maxWidth: "56ch" }}>
            <h3
              id="about-title"
              className="type-h3"
              style={{ marginBottom: "var(--space-4)", maxWidth: "20ch" }}
            >
              <Reveal>All About Coen.</Reveal>
            </h3>
            <div className="type-body" style={{ color: "var(--text-secondary)" }}>
              {lines.map((line, i) => (
                <Reveal
                  key={i}
                  delay={stagger.line(i)}
                  as="p"
                  style={{ marginBottom: "var(--space-2)" }}
                >
                  {line}
                </Reveal>
              ))}
            </div>
          </div>

          <ParallaxLayer speed={0.12} style={{ alignSelf: "start" }}>
            <div
              data-cursor="image"
              style={{
                position: "relative",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
                aspectRatio: "4 / 3",
              }}
            >
              <Image
                src="/about.jpg"
                alt="A photograph of Coen"
                fill
                sizes="(max-width: 900px) 100vw, 40vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          </ParallaxLayer>
        </div>
      </div>
    </section>
  );
}
