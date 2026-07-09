import { renderOG, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Photography — Coen";

export default function Image() {
  return renderOG({
    index: "03",
    title: "Photography",
    subtitle: "Light, held still.",
    dark: true,
  });
}
