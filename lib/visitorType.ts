"use client";

import { topSection } from "./engagement";

/*
 * visitorType.ts — infers *why* someone is here from where they went and what
 * held them: straight to the work (professional), lost in the photographs
 * (personal), reading the journal, drawn to the map, or touring everything.
 */

const SKEY = "coen.session.path";

export function recordRoute(path: string): void {
  try {
    const a: string[] = JSON.parse(sessionStorage.getItem(SKEY) || "[]");
    if (a[a.length - 1] !== path) a.push(path);
    sessionStorage.setItem(SKEY, JSON.stringify(a.slice(-24)));
  } catch {
    /* off */
  }
}

function sessionRoutes(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(SKEY) || "[]");
  } catch {
    return [];
  }
}

export interface VisitorType {
  label: string;
  line: string;
}

export function inferVisitorType(): VisitorType {
  const routes = sessionRoutes();
  const distinct = new Set(routes.filter((r) => r && r !== "/"));
  if (distinct.size >= 4)
    return { label: "the explorer", line: "You've been nearly everywhere — you're taking the whole tour." };

  const top = topSection();
  const firstRoute = routes.find((r) => r && r !== "/");
  const primary = top?.name ?? (firstRoute ? firstRoute.replace(/^\//, "").split("/")[0] : null);

  switch (primary) {
    case "projects":
      return { label: "here for the work", line: "You went for the work first — here to see what Coen builds." };
    case "photography":
      return { label: "here for the images", line: "You lingered in the photographs — here for the eye, not the résumé." };
    case "journal":
      return { label: "here to read", line: "You came to read — it was the words that held you." };
    case "travel":
      return { label: "here for the places", line: "The map drew you in — you're here for the places." };
    case "about":
      return { label: "here for the person", line: "You went straight to About — you're here for the person, not the portfolio." };
    default:
      return { label: "just arrived", line: "You're still getting your bearings." };
  }
}
