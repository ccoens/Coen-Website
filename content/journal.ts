import type { JournalEntry } from "./types";

/*
 * journal.ts — FILL (§15). Thoughts, not blog posts (§13). Keep bodies short.
 * Replace with real entries; dates are ISO for stable sorting.
 */
export const journal: JournalEntry[] = [
  {
    id: "entry-1",
    title: "Winning the Swift Student Challenge",
    date: "2026-03-26",
    body:
      "I woke up at 6am to an email from Apple Developer Relations telling me I " +
      "could check the status of my Swift Student Challenge submission. I had " +
      "almost forgotten I entered, which is crazy considering the amount of time, " +
      "effort, and stress I put into creating it. Winning was an incredibly " +
      "powerful moment and a reminder that with determination, persistence, and " +
      "belief in yourself, anything is possible.",
  },
  {
    id: "entry-2",
    title: "Joining Snapchat",
    date: "2025-05-02",
    body:
      "I woke up at 8am with my mother coming into my room to tell me I had been " +
      "invited to join Snapchat's team for the next 18 months. It was a moment of " +
      "incredible excitement, as I realised I would have the opportunity to work " +
      "alongside industry leaders and help make a difference in people's " +
      "experiences online. It was also the moment I discovered a deeper passion " +
      "for creating safer, more positive digital spaces.",
  },
];
