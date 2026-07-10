/*
 * geo.ts — small great-circle helpers for the "you and Coen" connection: how far
 * the visitor is from Canberra, and which way it lies. No dependencies.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export const CANBERRA: LatLng = { lat: -35.2802, lng: 149.131 };

const RAD = Math.PI / 180;

/** Great-circle distance in kilometres (haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLng = (b.lng - a.lng) * RAD;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Initial bearing from → to, degrees clockwise from north (0–360). */
export function bearingDeg(from: LatLng, to: LatLng): number {
  const φ1 = from.lat * RAD;
  const φ2 = to.lat * RAD;
  const dλ = (to.lng - from.lng) * RAD;
  const y = Math.sin(dλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/** Nearest 8-point compass word for a bearing. */
export function compass8(bearing: number): string {
  const names = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  return names[Math.round(bearing / 45) % 8];
}
