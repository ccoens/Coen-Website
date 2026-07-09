/*
 * time.ts — Canberra local time helpers. The site is a window into where Coen
 * is, so "now" here means Canberra (ACT observes the same clock as Sydney,
 * including daylight saving). Everything derives from Intl so it's correct
 * year-round without hardcoding offsets.
 */

const TZ = "Australia/Sydney"; // Canberra shares this zone (AEST/AEDT)

export interface CanberraNow {
  hh: string;
  mm: string;
  ss: string;
  hour: number; // 0–23, fractional (includes minutes) for smooth mapping
  partOfDay: "Morning" | "Afternoon" | "Evening" | "Night";
  /** 0 = deep night, 1 = midday. Smooth. Drives the day/night mood. */
  daylight: number;
}

export function canberraNow(date: Date = new Date()): CanberraNow {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  let hh = get("hour");
  const mm = get("minute");
  const ss = get("second");
  // Intl can emit "24" at midnight in some engines; normalise to "00".
  if (hh === "24") hh = "00";

  const hourNum = parseInt(hh, 10) + parseInt(mm, 10) / 60;

  const partOfDay: CanberraNow["partOfDay"] =
    hourNum >= 5 && hourNum < 12
      ? "Morning"
      : hourNum >= 12 && hourNum < 17
        ? "Afternoon"
        : hourNum >= 17 && hourNum < 21
          ? "Evening"
          : "Night";

  // Peak brightness ~13:00, trough ~01:00, smoothed with a cosine.
  const daylight = 0.5 + 0.5 * Math.cos(((hourNum - 13) / 24) * Math.PI * 2);

  return { hh, mm, ss, hour: hourNum, partOfDay, daylight };
}
