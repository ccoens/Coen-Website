"use client";

import Image from "next/image";
import { useState } from "react";
import type { Photo } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { ParallaxLayer } from "@/components/ui/ParallaxLayer";
import { PhotoViewer } from "@/components/ui/PhotoViewer";

/*
 * PhotoGallery — the interactive layer of the Photography scene. The overlapping
 * layout is unchanged; each photo is now a button that opens the fullscreen
 * PhotoViewer (liquid WebGL transitions) at its index.
 */

const LAYOUT = [
  { justify: "flex-start", width: "clamp(280px, 58vw, 760px)", mt: "0", speed: 0.1 },
  { justify: "flex-end", width: "clamp(200px, 34vw, 440px)", mt: "-8vh", speed: 0.22 },
  { justify: "center", width: "clamp(300px, 64vw, 860px)", mt: "-4vh", speed: 0.14 },
  { justify: "flex-start", width: "clamp(220px, 40vw, 520px)", mt: "-10vh", speed: 0.2 },
  { justify: "flex-end", width: "clamp(200px, 30vw, 400px)", mt: "-6vh", speed: 0.26 },
  { justify: "center", width: "clamp(300px, 70vw, 960px)", mt: "-2vh", speed: 0.12 },
  { justify: "flex-start", width: "clamp(220px, 38vw, 500px)", mt: "-9vh", speed: 0.2 },
] as const;

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {photos.map((photo, i) => {
          const l = LAYOUT[i % LAYOUT.length];
          return (
            <div key={photo.src + i} style={{ display: "flex", justifyContent: l.justify, marginTop: l.mt }}>
              <ParallaxLayer speed={l.speed} style={{ width: l.width, maxWidth: "100%" }}>
                <figure style={{ margin: 0 }}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    aria-label={`Open photograph ${i + 1}${photo.place ? ` — ${photo.place}` : ""} in viewer`}
                    data-cursor="image"
                    style={{
                      display: "block",
                      width: "100%",
                      padding: 0,
                      border: "1px solid var(--dark-border)",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      cursor: "pointer",
                      background: "transparent",
                      boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                    }}
                  >
                    <span
                      style={{
                        position: "relative",
                        display: "block",
                        aspectRatio: `${photo.width} / ${photo.height}`,
                      }}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 900px) 100vw, 70vw"
                        style={{ objectFit: "cover" }}
                      />
                    </span>
                  </button>
                  {photo.place && (
                    <Reveal delay={0.05}>
                      <figcaption className="type-caption" style={{ color: "var(--dark-text-tertiary)", marginTop: "var(--space-1)" }}>
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

      <PhotoViewer
        photos={photos}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}
