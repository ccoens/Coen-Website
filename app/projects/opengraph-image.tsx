import { renderOG, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Projects — Coen";

export default function Image() {
  return renderOG({
    index: "02",
    title: "Projects",
    subtitle: "Selected work, made with care.",
  });
}
