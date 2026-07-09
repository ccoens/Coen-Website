import Link from "next/link";
import type { Project } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { VelocitySkew } from "@/components/ui/VelocitySkew";
import { Magnetic } from "@/components/ui/Magnetic";
import { FeaturedTile } from "./FeaturedTile";

/*
 * FeaturedWork — the landing's curated glimpse of the work (not the full grid).
 * A few projects as interactive tilt tiles whose cover lifts on a Z plane for
 * real depth; the whole strip links out to /projects. Server component; the
 * Tilt leaves are client and degrade to static on touch/reduced-motion.
 */
export function FeaturedWork({ projects }: { projects: Project[] }) {
  // Only real, openable projects are featured on the landing — locked
  // "Coming soon" teasers live on the /projects page, not here.
  const featured = projects.filter((p) => !p.comingSoon).slice(0, 3);

  return (
    <section aria-labelledby="featured-title" className="scene">
      <div className="scene-inner">
        <Reveal>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              marginBottom: "var(--space-5)",
              flexWrap: "wrap",
            }}
          >
            <h2 id="featured-title" className="type-h2" style={{ fontSize: "clamp(32px, 5vw, 72px)" }}>
              Selected work
            </h2>
            <Magnetic strength={0.3}>
              <Link
                href="/projects"
                data-cursor="interactive"
                className="type-body"
                style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
              >
                All projects →
              </Link>
            </Magnetic>
          </div>
        </Reveal>

        <VelocitySkew
          className="featured-grid"
          style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "minmax(0,1fr)" }}
        >
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <FeaturedTile project={p} index={i} />
            </Reveal>
          ))}
        </VelocitySkew>
      </div>
    </section>
  );
}
