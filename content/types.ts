/*
 * content/types.ts — the typed content model (§15).
 * Scenes are dumb: they take these shapes as props and never invent data.
 * Unknown personal content is rendered from placeholders that visibly read as
 * "replace me" (see the *.ts data files) rather than fabricated to look real.
 */

export interface Profile {
  name: "Coen";
  heroStatement: "Building ideas that improve how people experience technology.";
  about: string;
  current: {
    label: "Reading" | "Building" | "Learning" | "Listening" | "Travelling";
    value: string;
  }[];
  email: string;
  socials: { label: string; href: string }[];
}

export interface ProjectImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  title: string;
  year: string;
  role: string;
  summary: string;
  href?: string;
  cover: ProjectImage;
  gallery?: ProjectImage[];
}

export interface Photo {
  src: string;
  alt: string;
  width: number;
  height: number;
  place?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  body: string;
}
