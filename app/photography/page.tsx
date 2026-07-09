import type { Metadata } from "next";
import { Photography } from "@/components/scenes/Photography";
import { Footer } from "@/components/scenes/Footer";
import { photos } from "@/content/photos";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Photography — Coen",
  description: "Light, held still.",
};

export default function PhotographyPage() {
  return (
    <>
      {/* The dark scene carries its own visible title; this h1 is the page's
          single semantic heading. */}
      <h1
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        Photography — Coen
      </h1>
      <Photography photos={photos} />
      <Footer profile={profile} />
    </>
  );
}
