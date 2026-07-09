import { renderOG, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Coen — Building ideas that improve how people experience technology.";

export default function Image() {
  return renderOG({
    index: "coen.life",
    title: "COEN",
    subtitle: "Building ideas that improve how people experience technology.",
  });
}
