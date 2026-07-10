"use client";

/*
 * SkyWash — a whisper-thin overlay tinted to the visitor's real local sky
 * (driven by --sky-c1/--sky-c2 from useSky). Overhead tint at the top, a warmer
 * horizon glow rising from the bottom. Deliberately low-alpha: it shifts the
 * mood without turning the light field into a dark theme. Fixed, decorative,
 * never interactive. Static under any motion setting — it just reflects "now".
 */
export function SkyWash() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage:
          "linear-gradient(180deg, var(--sky-c1, transparent) 0%, transparent 52%)," +
          "linear-gradient(0deg, var(--sky-c2, transparent) 0%, transparent 34%)",
      }}
    />
  );
}
