import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { TravelMap } from "@/components/scenes/TravelMap";
import { buildWorldMap } from "@/lib/worldMap";
import {
  visitedCountries,
  visitedMarkers,
  visitedLabels,
  travelStats,
  labelToMapName,
} from "@/content/travel";

export const metadata: Metadata = {
  title: "Travel — Coen",
  description: "29 countries across 5 continents — where I've been so far.",
};

export default function TravelPage() {
  // Geometry is projected on the server so d3-geo and the topojson mesh stay out
  // of the client bundle.
  const map = buildWorldMap(visitedCountries, visitedMarkers);

  return (
    <>
      <PageIntro
        index="05"
        title="Travel"
        lead="Where I've been so far — a map that fills in with every trip."
      />
      <TravelMap
        map={map}
        labels={visitedLabels}
        labelToMapName={labelToMapName}
        stats={travelStats}
      />
    </>
  );
}
