import type { Photo } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { PhotoGallery } from "./PhotoGallery";

/*
 * Photography scene (§13) — the one dark scene (§4 DECISION). Edge-to-edge,
 * overlapping images on a near-black field, laid out as a layered composition
 * with negative offsets and per-image parallax speeds so depth reads on scroll.
 * Captions fade in. Server component; only Parallax/Reveal leaves are client.
 *
 * It paints its own dark background over the fixed light field for this section
 * only — an exception, never a theme toggle.
 */

export function Photography({
  photos,
  hideHeader = false,
}: {
  photos: Photo[];
  hideHeader?: boolean;
}) {
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
        {!hideHeader && (
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
        )}

        <PhotoGallery photos={photos} />
      </div>
    </section>
  );
}
