"use client";

/*
 * engagement.ts — a private, on-device sense of what a visitor cares about.
 * We accumulate how long each named section holds their attention (in view), and
 * how many times they've visited, entirely in localStorage. This is what lets the
 * site personalise ("you're drawn to Photography") and reflect ("Photography
 * holds you longest") without any tracking leaving the browser.
 */

const KEY = "coen.engage.v1";

export interface Engagement {
  sections: Record<string, number>; // name → total ms attended
  visits: number;
}

// Human labels + destinations for the interest sections we track.
export const SECTION_META: Record<string, { label: string; href: string }> = {
  projects: { label: "Projects", href: "/projects" },
  photography: { label: "Photography", href: "/photography" },
  journal: { label: "Journal", href: "/journal" },
  travel: { label: "Travel", href: "/travel" },
  about: { label: "About", href: "/about" },
};

export function readEngagement(): Engagement {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const e = JSON.parse(raw) as Engagement;
      return { sections: e.sections ?? {}, visits: e.visits ?? 0 };
    }
  } catch {
    /* ignore */
  }
  return { sections: {}, visits: 0 };
}

function write(e: Engagement) {
  try {
    localStorage.setItem(KEY, JSON.stringify(e));
  } catch {
    /* storage off — feature no-ops */
  }
}

export function addDwell(section: string, ms: number): void {
  if (ms < 400) return; // ignore incidental glances
  const e = readEngagement();
  e.sections[section] = (e.sections[section] ?? 0) + ms;
  write(e);
}

export function bumpVisit(): number {
  const e = readEngagement();
  e.visits = (e.visits ?? 0) + 1;
  write(e);
  return e.visits;
}

export interface TopSection {
  name: string;
  ms: number;
  label: string;
  href: string;
}

/** The section that has held the most attention, if there's a clear signal. */
export function topSection(e: Engagement = readEngagement()): TopSection | null {
  const entries = Object.entries(e.sections).filter(([name]) => SECTION_META[name]);
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const [name, ms] = entries[0];
  if (ms < 4000) return null; // need a few seconds before we claim a favourite
  return { name, ms, ...SECTION_META[name] };
}
