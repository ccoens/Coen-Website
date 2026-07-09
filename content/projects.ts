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
    title: "Improve digital safety for everyone",
    year: "2025 – present",
    role: "Public Policy",
    summary:
      "Since 2025, I have worked to make digital spaces safer through " +
      "collaborations with companies such as Snapchat and organisations " +
      "including eSafety Australia. My work has focused on exploring " +
      "responsible approaches to social media regulation, including age " +
      "restrictions and strategies to better protect vulnerable users online.",
    href: undefined,
    cover: {
      src: "/project1-header.jpg",
      alt: "Coen at a Snapchat digital-wellbeing activation",
      width: 8256,
      height: 5504,
    },
    gallery: [
      { src: "/project1-2.jpg", alt: "Digital safety work with Snapchat and eSafety Australia", width: 7833, height: 5222 },
      { src: "/project1-3.jpeg", alt: "Digital safety work with Snapchat and eSafety Australia", width: 1170, height: 631 },
    ],
  },
  {
    id: "project-two",
    title: "Software & Apps for everyone",
    year: "2025",
    role: "Product & Software",
    summary:
      "As a 2026 Swift Student Challenge winner, I believe that accessibility " +
      "is simply good design. Guided by this motto, I strive to create apps " +
      "that are inclusive, intuitive, and beneficial for everyone, regardless " +
      "of ability or background.",
    href: undefined,
    cover: {
      src: "/project2-header.jpg",
      alt: "App design work by Coen",
      width: 2048,
      height: 1536,
    },
    gallery: [
      { src: "/project2-2.jpg", alt: "App design and prototyping work", width: 5712, height: 4284 },
      { src: "/project2-3.jpg", alt: "App design and prototyping work", width: 1600, height: 1200 },
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
