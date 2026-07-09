"use client";

import Image from "next/image";
import Link from "next/link";
import { m, useAnimationControls } from "framer-motion";
import type { Project } from "@/content/types";
import { Tilt } from "@/components/ui/Tilt";
import { Float } from "@/components/ui/Float";
import { LockedCover } from "@/components/ui/LockedCover";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * FeaturedTile — one card in the landing's "Selected work" strip. A normal
 * project is a Link into /projects; a `comingSoon` project is locked — it can't
 * be entered, and clicking it shakes the card (a polite "not yet") instead of
 * navigating. The floating/tilting presentation is identical either way.
 */

const SHAKE = { x: [0, -8, 8, -7, 7, -4, 4, 0] };

export function FeaturedTile({ project, index }: { project: Project; index: number }) {
  const reduced = useReducedMotion();
  const locked = !!project.comingSoon;
  const shake = useAnimationControls();

  const card = (
    <Float phase={index * 0.34} amplitude={7} duration={6 + index * 0.8}>
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
          data-cursor={locked ? undefined : "image"}
          className="featured-cover"
          style={{
            position: "relative",
            aspectRatio: "4 / 3",
            overflow: "hidden",
            transform: "translateZ(30px)",
          }}
        >
          {locked ? (
            <LockedCover />
          ) : (
            <>
              <Image
                src={project.cover.src}
                alt={project.cover.alt}
                fill
                sizes="(max-width: 900px) 100vw, 33vw"
                style={{ objectFit: "cover" }}
              />
              {/* Cinematic light-sweep + warm zoom on hover (CSS in globals). */}
              <span aria-hidden className="featured-sheen" />
            </>
          )}
        </div>
        <div style={{ padding: "var(--space-3)", transform: "translateZ(45px)" }}>
          <h3 className="type-h3" style={{ fontSize: "clamp(20px, 2vw, 26px)" }}>
            {project.title}
          </h3>
          <p className="type-caption" style={{ marginTop: "var(--space-1)" }}>
            {locked ? "In the works" : `${project.year} · ${project.role}`}
          </p>
        </div>
      </Tilt>
    </Float>
  );

  if (locked) {
    return (
      <m.div
        animate={shake}
        onClick={() => {
          if (!reduced) shake.start({ ...SHAKE, transition: { duration: 0.45, ease: "easeInOut" } });
        }}
        role="button"
        aria-disabled
        aria-label={`${project.title} — coming soon`}
        style={{ cursor: "not-allowed", display: "block" }}
      >
        {card}
      </m.div>
    );
  }

  return (
    <Link
      href="/projects"
      aria-label={`${project.title} — see in projects`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {card}
    </Link>
  );
}
