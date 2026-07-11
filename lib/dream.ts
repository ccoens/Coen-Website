"use client";

import { visitedLabels } from "@/content/travel";
import { rng } from "@/lib/visitor";

/*
 * dream.ts — the site's subconscious vocabulary. It recombines fragments of the
 * site's OWN content (what Coen builds, moments from the journal, the places
 * he's been) into surreal, never-repeating dream-lines. Seeded so any given
 * instant is deterministic but every instant differs.
 */

const IDEAS = [
  "building ideas",
  "digital safety, for all of us",
  "software meant for everyone",
  "how people feel their machines",
  "a birthday spent with Apple",
  "the Swift Student Challenge",
  "the day of joining Snapchat",
  "light, held still",
  "a name you can throw",
  "the work still unfinished",
  "improving how it all feels",
];

const LINKS = [
  "dissolving into",
  "drifting toward",
  "folded into",
  "somewhere over",
  "becoming",
  "half-remembered in",
  "adrift near",
  "unspooling across",
  "echoing through",
  "carried on to",
];

const CODAS = [
  "under southern stars",
  "at the edge of sleep",
  "in the small hours",
  "before the light returns",
  "while the city breathes",
  "in a room with no walls",
  "held in the dark",
  "as the tide of night turns",
  "where the map runs out",
  "long after midnight",
];

function pick<T>(a: readonly T[], r: () => number): T {
  return a[Math.floor(r() * a.length)];
}

export function dreamLine(seed: number): string {
  const r = rng(seed);
  const idea = pick(IDEAS, r);
  const link = pick(LINKS, r);
  const place = pick(visitedLabels, r);
  const coda = pick(CODAS, r);
  return r() < 0.72 ? `${idea}, ${link} ${place}, ${coda}` : `${idea} — ${coda}`;
}
