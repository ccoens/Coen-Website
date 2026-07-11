/*
 * travel.ts — the places Coen has been. `visitedCountries` names must match the
 * world-atlas countries-110m feature names exactly (they drive the map fills).
 * A handful of nations are too small to exist in the 110m mesh, so they're
 * carried separately as `visitedMarkers` and drawn as glowing dots instead.
 */

// Polygon-matched countries (exact world-atlas names).
export const visitedCountries = [
  "Egypt",
  "Indonesia",
  "Japan",
  "South Korea",
  "Thailand",
  "United Arab Emirates",
  "Austria",
  "Cyprus",
  "Czechia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Italy",
  "Netherlands",
  "Poland",
  "Portugal",
  "Slovakia",
  "Spain",
  "Switzerland",
  "United Kingdom",
  "United States of America",
  "Australia",
  "Fiji",
] as const;

// Too small for the 110m mesh — rendered as labelled markers ([lng, lat]).
export const visitedMarkers = [
  { name: "Singapore", lng: 103.82, lat: 1.35 },
  { name: "Malta", lng: 14.42, lat: 35.9 },
  { name: "San Marino", lng: 12.46, lat: 43.94 },
  { name: "Vatican City", lng: 12.45, lat: 41.9 },
] as const;

// Friendly, alphabetised labels for the list under the map. England & Wales are
// counted within the United Kingdom.
export const visitedLabels = [
  "Australia",
  "Austria",
  "Cyprus",
  "Czechia",
  "Egypt",
  "Fiji",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Indonesia",
  "Italy",
  "Japan",
  "Malta",
  "Netherlands",
  "Poland",
  "Portugal",
  "San Marino",
  "Singapore",
  "Slovakia",
  "South Korea",
  "Spain",
  "Switzerland",
  "Thailand",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Vatican City",
] as const;

// Headline stats.
export const travelStats = {
  countries: visitedLabels.length, // 30
  continents: 5, // Africa, Asia, Europe, North America, Oceania
};

// Maps a display label to the name used on the map (polygon or marker), so
// hovering a chip can highlight its country.
export const labelToMapName: Record<string, string> = {
  "United States": "United States of America",
};
