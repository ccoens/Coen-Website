import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import topo from "world-atlas/countries-110m.json";

/*
 * worldMap.ts — server-only geometry builder. Projects the world-atlas 110m
 * mesh with a Natural Earth projection and returns plain SVG path strings, so
 * d3-geo and the (large) topojson never reach the client bundle — the map
 * component only ever receives pre-computed `d` strings and marker coordinates.
 */

export interface MapCountry {
  name: string;
  d: string;
  visited: boolean;
}
export interface MapMarker {
  name: string;
  x: number;
  y: number;
}
export interface WorldMap {
  width: number;
  height: number;
  sphere: string;
  countries: MapCountry[];
  markers: MapMarker[];
}

const WIDTH = 980;
const HEIGHT = 500;

export function buildWorldMap(
  visited: readonly string[],
  markers: readonly { name: string; lng: number; lat: number }[],
): WorldMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = topo as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fc = feature(t, t.objects.countries) as any;
  // Antarctica dominates the lower frame and adds nothing here — drop it.
  const features = fc.features.filter(
    (f: { properties: { name: string } }) => f.properties.name !== "Antarctica",
  );

  const projection = geoNaturalEarth1();
  projection.fitExtent(
    [
      [12, 12],
      [WIDTH - 12, HEIGHT - 12],
    ],
    { type: "FeatureCollection", features },
  );
  const path = geoPath(projection);

  const visitedSet = new Set(visited);
  const countries: MapCountry[] = features
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((f: any) => ({
      name: f.properties.name as string,
      d: path(f) ?? "",
      visited: visitedSet.has(f.properties.name),
    }))
    .filter((c: MapCountry) => c.d.length > 0);

  const projMarkers: MapMarker[] = markers
    .map((m) => {
      const p = projection([m.lng, m.lat]);
      return p ? { name: m.name, x: p[0], y: p[1] } : null;
    })
    .filter((m): m is MapMarker => m !== null);

  const sphere = path({ type: "Sphere" }) ?? "";

  return { width: WIDTH, height: HEIGHT, sphere, countries, markers: projMarkers };
}
