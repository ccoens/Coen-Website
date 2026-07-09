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
    "FILL: about — a short first-person paragraph on who Coen is and how he works. " +
    "Two or three sentences, plain-spoken and specific. It should read like a person " +
    "thinking in public, not a résumé. Replace this text in content/profile.ts.",

  current: [
    { label: "Reading", value: "FILL: current book or essay" },
    { label: "Building", value: "FILL: the thing being made right now" },
    { label: "Learning", value: "FILL: a skill or subject in progress" },
    { label: "Listening", value: "FILL: an album, artist or podcast" },
    { label: "Travelling", value: "FILL: where, or “home for now”" },
  ],

  email: "FILL: hello@coen.life",

  socials: [
    { label: "FILL: X", href: "#fill-x" },
    { label: "FILL: GitHub", href: "#fill-github" },
    { label: "FILL: Read.cv", href: "#fill-readcv" },
  ],
};
