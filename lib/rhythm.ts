"use client";

/*
 * rhythm.ts — remembers when you visit (timestamps only, on-device) and reads a
 * pattern back: you come at night, you come on Sundays, you keep coming back.
 */

const KEY = "coen.rhythm.v1";
const DEDUPE_MS = 20 * 60 * 1000;

function read(): number[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(a: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* off */
  }
}

/** Record this visit's time, unless one was recorded very recently. */
export function recordVisitTime(): void {
  const a = read();
  const now = Date.now();
  if (a.length && now - a[a.length - 1] < DEDUPE_MS) return;
  a.push(now);
  while (a.length > 60) a.shift();
  write(a);
}

const DAY_NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

export function rhythmInsight(): string | null {
  const t = read();
  if (t.length < 3) return null;

  const hours = t.map((x) => new Date(x).getHours());
  const night = hours.filter((h) => h >= 21 || h < 5).length / hours.length;
  const morning = hours.filter((h) => h >= 5 && h < 11).length / hours.length;
  if (night > 0.66) return "You come in the dark — most of your visits are late.";
  if (morning > 0.66) return "You're a morning visitor.";

  const days = t.map((x) => new Date(x).getDay());
  const counts = Array(7).fill(0);
  days.forEach((d) => counts[d]++);
  const max = Math.max(...counts);
  if (max / days.length > 0.55) return `You tend to arrive on ${DAY_NAMES[counts.indexOf(max)]}.`;

  return `You've found your way back here ${t.length} times now.`;
}
