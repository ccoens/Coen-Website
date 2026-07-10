"use client";

import { useEffect } from "react";

/*
 * sky.ts — the visitor's REAL local sky, from their timezone + solar geometry
 * (no API, no geolocation prompt). We resolve the browser's IANA timezone to a
 * representative latitude/longitude, compute the sun's elevation right now, and
 * map it to a subtle tint: cool at night, rose at dawn, amber at golden hour,
 * bright and neutral by day. It's a whisper on the warm off-white field — a
 * night visitor feels calm blue, a golden-hour visitor feels warmth — never a
 * full theme flip (the site stays light by design).
 *
 * The mood is published as CSS custom properties (--sky-c1/--sky-c2 for the
 * wash, --sky-daylight/--sky-gold/--sky-hue for the shader) and refreshed each
 * minute.
 */

// Representative [lat, lng] for common IANA zones — enough latitude signal that
// high-latitude visitors get real long-summer / dark-winter skies. Unknown
// zones fall back to the visitor's local clock hour (see solarElevation).
const TZ_COORDS: Record<string, [number, number]> = {
  "America/New_York": [40.7, -74.0],
  "America/Detroit": [42.3, -83.0],
  "America/Chicago": [41.8, -87.6],
  "America/Denver": [39.7, -105.0],
  "America/Phoenix": [33.4, -112.1],
  "America/Los_Angeles": [34.0, -118.2],
  "America/Toronto": [43.7, -79.4],
  "America/Vancouver": [49.3, -123.1],
  "America/Mexico_City": [19.4, -99.1],
  "America/Sao_Paulo": [-23.5, -46.6],
  "America/Bogota": [4.7, -74.1],
  "America/Argentina/Buenos_Aires": [-34.6, -58.4],
  "America/Lima": [-12.0, -77.0],
  "America/Santiago": [-33.4, -70.6],
  "America/Anchorage": [61.2, -149.9],
  "America/Halifax": [44.6, -63.6],
  "Europe/London": [51.5, -0.1],
  "Europe/Dublin": [53.3, -6.3],
  "Europe/Lisbon": [38.7, -9.1],
  "Europe/Madrid": [40.4, -3.7],
  "Europe/Paris": [48.9, 2.3],
  "Europe/Amsterdam": [52.4, 4.9],
  "Europe/Brussels": [50.8, 4.4],
  "Europe/Berlin": [52.5, 13.4],
  "Europe/Zurich": [47.4, 8.5],
  "Europe/Vienna": [48.2, 16.4],
  "Europe/Prague": [50.1, 14.4],
  "Europe/Rome": [41.9, 12.5],
  "Europe/Warsaw": [52.2, 21.0],
  "Europe/Budapest": [47.5, 19.0],
  "Europe/Athens": [38.0, 23.7],
  "Europe/Stockholm": [59.3, 18.1],
  "Europe/Oslo": [59.9, 10.7],
  "Europe/Helsinki": [60.2, 24.9],
  "Europe/Istanbul": [41.0, 28.9],
  "Europe/Moscow": [55.8, 37.6],
  "Africa/Casablanca": [33.6, -7.6],
  "Africa/Lagos": [6.5, 3.4],
  "Africa/Cairo": [30.0, 31.2],
  "Africa/Nairobi": [-1.3, 36.8],
  "Africa/Johannesburg": [-26.2, 28.0],
  "Asia/Jerusalem": [31.8, 35.2],
  "Asia/Riyadh": [24.7, 46.7],
  "Asia/Dubai": [25.2, 55.3],
  "Asia/Tehran": [35.7, 51.4],
  "Asia/Karachi": [24.9, 67.0],
  "Asia/Kolkata": [28.6, 77.2],
  "Asia/Calcutta": [28.6, 77.2],
  "Asia/Dhaka": [23.8, 90.4],
  "Asia/Bangkok": [13.8, 100.5],
  "Asia/Jakarta": [-6.2, 106.8],
  "Asia/Ho_Chi_Minh": [10.8, 106.7],
  "Asia/Singapore": [1.35, 103.8],
  "Asia/Kuala_Lumpur": [3.1, 101.7],
  "Asia/Manila": [14.6, 121.0],
  "Asia/Hong_Kong": [22.3, 114.2],
  "Asia/Taipei": [25.0, 121.6],
  "Asia/Shanghai": [31.2, 121.5],
  "Asia/Seoul": [37.6, 127.0],
  "Asia/Tokyo": [35.7, 139.7],
  "Australia/Perth": [-31.95, 115.9],
  "Australia/Adelaide": [-34.9, 138.6],
  "Australia/Brisbane": [-27.5, 153.0],
  "Australia/Sydney": [-33.9, 151.2],
  "Australia/Melbourne": [-37.8, 145.0],
  "Pacific/Auckland": [-36.8, 174.8],
  "Pacific/Honolulu": [21.3, -157.8],
  "Pacific/Fiji": [-18.1, 178.4],
};

const RAD = Math.PI / 180;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function smooth(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export interface Sky {
  /** Sun elevation in degrees (can be negative at night). */
  elevation: number;
  /** 0 = deep night, 1 = high sun. Smooth. */
  daylight: number;
  /** 0..1 how much "golden hour" warmth applies. */
  gold: number;
  /** 0..1 how deep the night is. */
  night: number;
  /** true while the sun is climbing (dawn side). */
  rising: boolean;
  /** Dominant tint hue in degrees. */
  hue: number;
  /** Two ready-to-use wash colours (overhead → horizon). */
  c1: string;
  c2: string;
  label: string;
}

/** Sun elevation for a lat/lng at a moment (simplified, EoT-free). */
function solarElevation(date: Date, lat: number, lng: number) {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86_400_000);
  const decl = -23.44 * Math.cos(RAD * (360 / 365) * (dayOfYear + 10));
  const utcH =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const solarTime = (utcH + lng / 15 + 24) % 24;
  const H = 15 * (solarTime - 12); // hour angle, degrees
  const elev =
    Math.asin(
      Math.sin(lat * RAD) * Math.sin(decl * RAD) +
        Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(H * RAD),
    ) / RAD;
  return { elev, rising: H < 0 };
}

export function visitorSky(date: Date = new Date()): Sky {
  let lat: number | null = null;
  let lng = 0;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const coords = TZ_COORDS[tz];
    if (coords) [lat, lng] = coords;
    else {
      // Fallback: derive longitude from the current UTC offset (minutes west).
      lng = (-date.getTimezoneOffset() / 60) * 15;
    }
  } catch {
    lng = 0;
  }

  // Unknown latitude → assume equatorial so day/night still tracks local solar
  // time, just without seasonal length.
  const { elev, rising } = solarElevation(date, lat ?? 0, lng);

  const daylight = smooth(-6, 30, elev);
  const night = 1 - smooth(-12, 6, elev);
  const gold = clamp01(1 - Math.abs(elev - 1) / 9); // peak near the horizon

  // Tint by regime, interpolated so transitions are continuous.
  let hue: number, sat: number, light: number, alpha: number;
  let label: string;
  if (elev > 12) {
    hue = 205;
    sat = 50;
    light = 80;
    alpha = 0.045;
    label = "day";
  } else if (elev > -1) {
    const k = (elev + 1) / 13; // 0 → horizon, 1 → daylight
    hue = lerp(rising ? 34 : 30, 205, k);
    sat = lerp(74, 50, k);
    light = lerp(70, 80, k);
    alpha = lerp(0.1, 0.05, k);
    label = "golden hour";
  } else if (elev > -12) {
    const k = (elev + 12) / 11; // 0 deep twilight, 1 near golden
    hue = rising ? lerp(300, 344, k) : lerp(252, 276, k);
    sat = 46;
    light = lerp(52, 66, k);
    alpha = 0.1;
    label = rising ? "dawn" : "dusk";
  } else {
    hue = 232;
    sat = 45;
    light = 52;
    alpha = 0.12;
    label = "night";
  }

  const c1 = `hsla(${hue.toFixed(0)}, ${sat}%, ${light}%, ${alpha.toFixed(3)})`;
  // Horizon glow: a touch warmer and lighter for the twilight/gold regimes.
  const warmHue = elev < 12 && elev > -12 ? (rising ? 26 : 20) : hue;
  const c2 = `hsla(${warmHue.toFixed(0)}, ${Math.min(sat + 14, 80)}%, ${Math.min(light + 12, 90)}%, ${(alpha * 0.75).toFixed(3)})`;

  return { elevation: elev, daylight, gold, night, rising, hue, c1, c2, label };
}

/**
 * useSky — publishes the visitor's live sky to CSS custom properties and keeps
 * them fresh (every 60s). Reduced motion is honoured by the consumers (the wash
 * is static either way; it simply reflects the current sky).
 */
export function useSky(): void {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const s = visitorSky();
      root.style.setProperty("--sky-c1", s.c1);
      root.style.setProperty("--sky-c2", s.c2);
      root.style.setProperty("--sky-daylight", s.daylight.toFixed(3));
      root.style.setProperty("--sky-gold", s.gold.toFixed(3));
      root.style.setProperty("--sky-night", s.night.toFixed(3));
      root.style.setProperty("--sky-hue", s.hue.toFixed(0));
    };
    apply();
    const id = window.setInterval(apply, 60_000);
    return () => window.clearInterval(id);
  }, []);
}
