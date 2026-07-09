import type { Profile } from "./types";

/*
 * profile.ts — Coen's profile.
 * PROVIDED by the spec: name, heroStatement.
 * FILL: about, current, email, socials. These are placeholder strings that
 * read as "replace me" on the page so gaps stay visible (§15, §19). Swap the
 * values here for real content — no component changes required.
 */
export const profile: Profile = {
  name: "Coen",
  heroStatement:
    "Building ideas that improve how people experience technology.",

  about:
    "I'm Coen, a student and creator who has lived in four countries and loves " +
    "exploring new places, cultures, and perspectives. I'm driven by curiosity — " +
    "whether that means building technology, learning from different communities, " +
    "or meeting new people along the way. I believe the best ideas come from " +
    "understanding the world around us and creating things that can make a " +
    "positive impact for everyone.",

  current: [
    { label: "Reading", value: "The Giver by Lois Lowry" },
    { label: "Building", value: "Swift Student Challenge 2027 entry" },
    { label: "Learning", value: "Spanish, for my International Baccalaureate exams" },
    { label: "Listening", value: "After Hours by The Weeknd" },
    { label: "Travelling", value: "All around Europe" },
  ],

  email: "coenhatcherross@gmail.com",

  socials: [
    { label: "FILL: X", href: "#fill-x" },
    { label: "FILL: GitHub", href: "#fill-github" },
    { label: "FILL: Read.cv", href: "#fill-readcv" },
  ],
};
