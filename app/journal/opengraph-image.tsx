import { renderOG, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Journal — Coen";

export default function Image() {
  return renderOG({
    index: "04",
    title: "Journal",
    subtitle: "Notes to self, in the open.",
  });
}
