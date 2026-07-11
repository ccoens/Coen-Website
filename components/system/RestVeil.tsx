"use client";

/*
 * RestVeil — the visible half of the circadian pulse. While Coen sleeps, a cool,
 * low overhead veil settles over the page (driven by --rest), so the whole site
 * reads as resting alongside him, then lifts as he wakes. Kept low-alpha so text
 * stays legible; it's a mood, not a blackout. Fixed, decorative, non-interactive.
 */
export function RestVeil() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3,
        pointerEvents: "none",
        opacity: "var(--rest, 0)",
        transition: "opacity 4s linear",
        background:
          "radial-gradient(130% 100% at 50% -10%, hsl(232 40% 30% / 0.16), transparent 55%)," +
          "linear-gradient(180deg, hsl(238 42% 26% / 0.10), hsl(240 44% 18% / 0.06))",
      }}
    />
  );
}
