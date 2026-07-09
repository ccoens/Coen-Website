import type { Photo } from "./types";

/*
 * photos.ts — FILL (§15). Varied aspect ratios drive the overlapping,
 * edge-to-edge Photography composition (§13). Replace src/alt/place and swap
 * the /placeholders/* files for real photographs in /public.
 */
export const photos: Photo[] = [
  { src: "/photos1.jpg", alt: "Photograph by Coen", width: 1200, height: 1600 },
  { src: "/photos2.jpg", alt: "Photograph by Coen", width: 2268, height: 4032 },
  { src: "/photos3.jpg", alt: "Photograph by Coen", width: 4032, height: 3024 },
  { src: "/photos4.jpg", alt: "Photograph by Coen", width: 3648, height: 2736 },
];
