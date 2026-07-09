import type { Project } from "./types";

/*
 * projects.ts — FILL (§15). Structure and image dimensions are real so layout,
 * CLS and the exhibition-panel expansion all work; titles/summaries are visible
 * placeholders. Replace with real projects and swap the /placeholders/* covers
 * for real assets in /public.
 */
export const projects: Project[] = [
  {
    id: "project-one",
    title: "FILL: Project One",
    year: "2025",
    role: "Design & Engineering",
    summary:
      "FILL: one or two sentences on what this project is, the problem it solves, " +
      "and your role. Concrete beats grand.",
    href: undefined,
    cover: {
      src: "/placeholders/project-1-cover.svg",
      alt: "FILL: cover image for Project One",
      width: 1600,
      height: 1000,
    },
    gallery: [
      { src: "/placeholders/project-1-a.svg", alt: "FILL: detail image", width: 1600, height: 1000 },
      { src: "/placeholders/project-1-b.svg", alt: "FILL: detail image", width: 1200, height: 1500 },
    ],
  },
  {
    id: "project-two",
    title: "FILL: Project Two",
    year: "2024",
    role: "Product & Prototyping",
    summary:
      "FILL: what it is and why it mattered. Keep it human — what did people " +
      "experience differently because this existed?",
    href: undefined,
    cover: {
      src: "/placeholders/project-2-cover.svg",
      alt: "FILL: cover image for Project Two",
      width: 1600,
      height: 1000,
    },
    gallery: [
      { src: "/placeholders/project-2-a.svg", alt: "FILL: detail image", width: 1600, height: 1000 },
      { src: "/placeholders/project-2-b.svg", alt: "FILL: detail image", width: 1600, height: 1000 },
    ],
  },
  {
    id: "project-three",
    title: "FILL: Project Three",
    year: "2024",
    role: "Research & Interface",
    summary:
      "FILL: a sentence or two. If there's a link to a live thing or write-up, " +
      "add it as `href` and the panel will surface it.",
    href: undefined,
    cover: {
      src: "/placeholders/project-3-cover.svg",
      alt: "FILL: cover image for Project Three",
      width: 1600,
      height: 1000,
    },
    gallery: [
      { src: "/placeholders/project-3-a.svg", alt: "FILL: detail image", width: 1200, height: 1500 },
    ],
  },
  {
    id: "project-four",
    title: "FILL: Project Four",
    year: "2023",
    role: "Concept & Build",
    summary:
      "FILL: closing project. Even a small experiment belongs here if it shows " +
      "how you think.",
    href: undefined,
    cover: {
      src: "/placeholders/project-4-cover.svg",
      alt: "FILL: cover image for Project Four",
      width: 1600,
      height: 1000,
    },
    gallery: [
      { src: "/placeholders/project-4-a.svg", alt: "FILL: detail image", width: 1600, height: 1000 },
      { src: "/placeholders/project-4-b.svg", alt: "FILL: detail image", width: 1600, height: 1000 },
    ],
  },
];
