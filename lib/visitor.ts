"use client";

/*
 * visitor.ts — a privacy-light sense of "who's here", computed entirely on the
 * device. A stable id is hashed from coarse, non-identifying browser signals
 * (timezone, screen size, language) — enough to give each visitor a one-of-one
 * generative sigil and to recognise a return, with no cookies, accounts, or
 * network. Visit history lives in localStorage only.
 */

const KEY = "coen.visit.v1";

export interface VisitorIdentity {
  /** 0–99,999 — the visitor's "number". */
  id: number;
  /** 32-bit seed for the sigil generator. */
  seed: number;
}

export function visitorIdentity(): VisitorIdentity {
  let str = "coen";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    str = [
      tz,
      `${screen.width}x${screen.height}`,
      String(screen.colorDepth),
      navigator.language,
    ].join("|");
  } catch {
    /* keep the fallback seed */
  }
  // FNV-1a
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  const seed = h >>> 0;
  return { id: seed % 100000, seed };
}

/** mulberry32 — tiny deterministic RNG so a seed always yields the same sigil. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SigilStar {
  x: number;
  y: number;
  r: number;
}

/** A unique little constellation from a seed, laid out in a 0–100 box. */
export function sigilStars(seed: number, count = 6): SigilStar[] {
  const rand = rng(seed);
  const stars: SigilStar[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: 16 + rand() * 68,
      y: 16 + rand() * 68,
      r: 1.1 + rand() * 2.2,
    });
  }
  return stars;
}

export interface VisitRecord {
  first: number;
  last: number;
  count: number;
  photos: number;
  projects: number;
}

export function readVisit(): VisitRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VisitRecord) : null;
  } catch {
    return null;
  }
}

export function writeVisit(rec: VisitRecord): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    /* storage disabled — feature simply no-ops */
  }
}

/** Humanise an elapsed span, e.g. "3 days" or "just now". */
export function elapsedLabel(ms: number): string {
  const min = ms / 60000;
  if (min < 1) return "moments";
  if (min < 60) return `${Math.round(min)} minute${Math.round(min) === 1 ? "" : "s"}`;
  const hr = min / 60;
  if (hr < 24) return `${Math.round(hr)} hour${Math.round(hr) === 1 ? "" : "s"}`;
  const d = hr / 24;
  if (d < 30) return `${Math.round(d)} day${Math.round(d) === 1 ? "" : "s"}`;
  const mo = d / 30;
  if (mo < 12) return `${Math.round(mo)} month${Math.round(mo) === 1 ? "" : "s"}`;
  return `${Math.round(mo / 12)} year${Math.round(mo / 12) === 1 ? "" : "s"}`;
}
