import { renderOG, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "About — Coen";

export default function Image() {
  return renderOG({
    index: "01",
    title: "About",
    subtitle: "A person thinking and building in public.",
  });
}
