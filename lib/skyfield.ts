import { stars, type Star } from "@/content/stars";

/*
 * skyfield.ts — projects the bright-star catalogue onto Canberra's sky dome for
 * a given moment. Computes Greenwich sidereal time, then each star's altitude
 * and azimuth, and maps the visible hemisphere (alt > 0) onto a unit disc as a
 * planisphere (zenith at centre, horizon at the rim). Simplified but faithful
 * enough that the Southern Cross, Orion and Scorpius land where they should.
 */

const CANBERRA_LAT = -35.28;
const CANBERRA_LNG = 149.13;
const RAD = Math.PI / 180;

export interface ProjectedStar {
  x: number; // 0..1 within the dome disc
  y: number; // 0..1
  mag: number;
}

function gmstHours(date: Date): number {
  const jd = date.getTime() / 86_400_000 + 2440587.5;
  const d = jd - 2451545.0;
  const t = d / 36525;
  let gmst =
    280.46061837 + 360.98564736629 * d + 0.000387933 * t * t - (t * t * t) / 38_710_000;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst / 15;
}

export function canberraStarDome(date: Date = new Date()): ProjectedStar[] {
  const lst = (gmstHours(date) + CANBERRA_LNG / 15 + 24) % 24; // local sidereal, hours
  const phi = CANBERRA_LAT * RAD;
  const out: ProjectedStar[] = [];

  for (const s of stars as Star[]) {
    const H = ((lst - s.ra) * 15) * RAD; // hour angle, radians
    const dec = s.dec * RAD;
    const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    if (alt <= 0) continue; // below the horizon

    // Azimuth from north, east-positive.
    const az = Math.atan2(
      -Math.cos(dec) * Math.sin(H),
      Math.sin(dec) * Math.cos(phi) - Math.cos(dec) * Math.sin(phi) * Math.cos(H),
    );

    // Planisphere: radius grows from zenith (0) to horizon (1).
    const r = (Math.PI / 2 - alt) / (Math.PI / 2);
    const x = 0.5 + 0.5 * r * Math.sin(az);
    const y = 0.5 - 0.5 * r * Math.cos(az);
    out.push({ x, y, mag: s.mag });
  }
  return out;
}
