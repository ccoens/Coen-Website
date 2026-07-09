import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { Tilt } from "@/components/ui/Tilt";
import { Float } from "@/components/ui/Float";
import { VelocitySkew } from "@/components/ui/VelocitySkew";
import { Magnetic } from "@/components/ui/Magnetic";

/*
 * FeaturedWork — the landing's curated glimpse of the work (not the full grid).
 * A few projects as interactive tilt tiles whose cover lifts on a Z plane for
 * real depth; the whole strip links out to /projects. Server component; the
 * Tilt leaves are client and degrade to static on touch/reduced-motion.
 */
export function FeaturedWork({ projects }: { projects: Project[] }) {
  const featured = projects.slice(0, 3);

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
              <Link
                href="/projects"
                aria-label={`${p.title} — see in projects`}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <Float phase={i * 0.34} amplitude={7} duration={6 + i * 0.8}>
                  <Tilt
                    max={7}
                    className="featured-tile"
                    style={{
                      position: "relative",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      boxShadow: "0 18px 60px rgba(0,0,0,0.09)",
                      background: "var(--surface-solid)",
                    }}
                  >
                    <div
                      data-cursor="image"
                      className="featured-cover"
                      style={{
                        position: "relative",
                        aspectRatio: "4 / 3",
                        overflow: "hidden",
                        transform: "translateZ(30px)",
                      }}
                    >
                      <Image
                        src={p.cover.src}
                        alt={p.cover.alt}
                        fill
                        sizes="(max-width: 900px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />
                      {/* Cinematic light-sweep + warm zoom on hover (CSS in globals). */}
                      <span aria-hidden className="featured-sheen" />
                    </div>
                    <div style={{ padding: "var(--space-3)", transform: "translateZ(45px)" }}>
                      <h3 className="type-h3" style={{ fontSize: "clamp(20px, 2vw, 26px)" }}>
                        {p.title}
                      </h3>
                      <p className="type-caption" style={{ marginTop: "var(--space-1)" }}>
                        {p.year} · {p.role}
                      </p>
                    </div>
                  </Tilt>
                </Float>
              </Link>
            </Reveal>
          ))}
        </VelocitySkew>
      </div>
    </section>
  );
}
