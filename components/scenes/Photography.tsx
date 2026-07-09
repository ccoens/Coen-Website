import Image from "next/image";
import type { Photo } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { ParallaxLayer } from "@/components/ui/ParallaxLayer";

/*
 * Photography scene (§13) — the one dark scene (§4 DECISION). Edge-to-edge,
 * overlapping images on a near-black field, laid out as a layered composition
 * with negative offsets and per-image parallax speeds so depth reads on scroll.
 * Captions fade in. Server component; only Parallax/Reveal leaves are client.
 *
 * It paints its own dark background over the fixed light field for this section
 * only — an exception, never a theme toggle.
 */

// Per-image composition: horizontal placement, width, vertical overlap, depth.
const LAYOUT = [
  { justify: "flex-start", width: "clamp(280px, 58vw, 760px)", mt: "0", speed: 0.1 },
  { justify: "flex-end", width: "clamp(200px, 34vw, 440px)", mt: "-8vh", speed: 0.22 },
  { justify: "center", width: "clamp(300px, 64vw, 860px)", mt: "-4vh", speed: 0.14 },
  { justify: "flex-start", width: "clamp(220px, 40vw, 520px)", mt: "-10vh", speed: 0.2 },
  { justify: "flex-end", width: "clamp(200px, 30vw, 400px)", mt: "-6vh", speed: 0.26 },
  { justify: "center", width: "clamp(300px, 70vw, 960px)", mt: "-2vh", speed: 0.12 },
  { justify: "flex-start", width: "clamp(220px, 38vw, 500px)", mt: "-9vh", speed: 0.2 },
] as const;

export function Photography({ photos }: { photos: Photo[] }) {
  return (
    <section
      id="photography"
      aria-labelledby="photography-title"
      style={{
        position: "relative",
        background: "var(--dark-bg)",
        color: "var(--dark-text-primary)",
        paddingBlock: "var(--space-9)",
        paddingInline: "var(--margin-mobile)",
        overflow: "hidden",
        // Full-bleed within the single canvas.
        marginBlock: "var(--space-8)",
      }}
    >
      <div style={{ maxWidth: "var(--content-max)", margin: "0 auto" }}>
        <header style={{ marginBottom: "var(--space-6)" }}>
          <Reveal>
            <p
              className="type-caption"
              style={{ color: "var(--dark-text-tertiary)", marginBottom: "var(--space-2)" }}
            >
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>03</span>
              {"  —  PHOTOGRAPHY"}
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2
              id="photography-title"
              className="type-h2"
              style={{ color: "var(--dark-text-primary)", maxWidth: "16ch" }}
            >
              Light, held still.
            </h2>
          </Reveal>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {photos.map((photo, i) => {
            const l = LAYOUT[i % LAYOUT.length];
            return (
              <div
                key={photo.src + i}
                style={{ display: "flex", justifyContent: l.justify, marginTop: l.mt }}
              >
                <ParallaxLayer speed={l.speed} style={{ width: l.width, maxWidth: "100%" }}>
                  <figure style={{ margin: 0 }}>
                    <div
                      data-cursor="image"
                      style={{
                        position: "relative",
                        aspectRatio: `${photo.width} / ${photo.height}`,
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                        border: "1px solid var(--dark-border)",
                        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                      }}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 900px) 100vw, 70vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    {photo.place && (
                      <Reveal delay={0.05}>
                        <figcaption
                          className="type-caption"
                          style={{
                            color: "var(--dark-text-tertiary)",
                            marginTop: "var(--space-1)",
                          }}
                        >
                          {photo.place}
                        </figcaption>
                      </Reveal>
                    )}
                  </figure>
                </ParallaxLayer>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
