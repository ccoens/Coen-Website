"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { visitorLocation, visitorSky } from "@/lib/sky";
import { CANBERRA, haversineKm, bearingDeg, compass8, type LatLng } from "@/lib/geo";
import { canberraNow, coenAsleep } from "@/lib/time";
import { visitorIdentity, rng } from "@/lib/visitor";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * VisitorLine — a single sentence composed live from the visitor's real context
 * (which way Coen lies, how far, the light where they are, and what Coen is
 * doing right now). Seeded by the visitor + the hour, so it's stable within a
 * visit but almost certainly a sentence no one has read before. Client-only.
 */

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function composeLine(): string {
  const now = new Date();
  const cnow = canberraNow(now);
  const asleep = coenAsleep(cnow);
  const loc = visitorLocation(now);
  const sky = visitorSky(now);
  const seed = (visitorIdentity().seed ^ (cnow.hour | 0)) >>> 0;
  const r = rng(seed);

  const dir =
    loc.known && loc.lat != null
      ? `the ${compass8(bearingDeg({ lat: loc.lat, lng: loc.lng } as LatLng, CANBERRA))}`
      : "somewhere far";
  const km =
    loc.known && loc.lat != null
      ? `${(Math.round(haversineKm({ lat: loc.lat, lng: loc.lng }, CANBERRA) / 10) * 10).toLocaleString()} km`
      : "half a world";

  const light =
    sky.night > 0.6
      ? pick(["in the depth of your night", "under your dark sky", "while your stars are out"], r)
      : sky.gold > 0.5
        ? pick(["at your golden hour", "in low, amber light", "as your sun sits low"], r)
        : sky.daylight > 0.5
          ? pick(["under your high sun", "in the full of your day", "in broad daylight"], r)
          : pick(["as your light turns", "in the half-light", "at the edge of your day"], r);

  const h = cnow.hour;
  const coen = asleep
    ? pick(["Coen dreams", "Coen is fast asleep", "Coen sleeps under southern stars"], r)
    : h < 9
      ? pick(["Coen is waking", "Coen stirs into his morning"], r)
      : h < 17
        ? pick(["Coen is deep in the work", "Coen builds through his day"], r)
        : pick(["Coen winds down his evening", "Coen reads before bed"], r);

  const shared = sky.night > 0.6 && asleep ? " — the same night over you both" : "";

  const templates = [
    `You came from ${dir}, ${light}, while ${coen}${shared}.`,
    `${km} of curved earth between you — ${light}, ${coen}${shared}.`,
    `From ${dir}, ${light}: right now, ${coen}${shared}.`,
  ];
  return pick(templates, r);
}

export function VisitorLine() {
  const reduced = useReducedMotion();
  const [line, setLine] = useState<string | null>(null);
  useEffect(() => setLine(composeLine()), []);

  if (!line) return null;

  return (
    <m.p
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.7 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="type-body"
      style={{
        textAlign: "center",
        maxWidth: "34ch",
        margin: "0 auto",
        color: "var(--text-secondary)",
        fontStyle: "italic",
        lineHeight: 1.6,
      }}
    >
      {line}
    </m.p>
  );
}
