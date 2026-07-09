import type { JournalEntry } from "./types";

/*
 * journal.ts — FILL (§15). Thoughts, not blog posts (§13). Keep bodies short.
 * Replace with real entries; dates are ISO for stable sorting.
 */
export const journal: JournalEntry[] = [
  {
    id: "entry-1",
    title: "FILL: a short title",
    date: "2026-06-18",
    body:
      "FILL: a paragraph of thinking. Something you noticed, changed your mind " +
      "about, or want to remember. Write it the way you'd tell a friend, not the " +
      "way you'd write a post.",
  },
  {
    id: "entry-2",
    title: "FILL: another note",
    date: "2026-04-02",
    body:
      "FILL: a second thought. These are dated and stack newest-first, but they " +
      "aren't announcements — they're a record of a mind at work.",
  },
  {
    id: "entry-3",
    title: "FILL: an older note",
    date: "2026-01-27",
    body:
      "FILL: keep them sparse. A journal that breathes says more than one that's " +
      "full. Replace this in content/journal.ts.",
  },
];
