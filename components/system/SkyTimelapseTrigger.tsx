"use client";

/*
 * SkyTimelapseTrigger — a quiet invitation, next to the live Canberra time, to
 * watch a whole day pass through the site. Dispatches the event SkyTimelapse
 * listens for.
 */
export function SkyTimelapseTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("coen:timelapse"))}
      data-cursor="interactive"
      className="type-caption"
      style={{
        marginTop: "var(--space-3)",
        background: "transparent",
        border: "none",
        padding: 0,
        color: "var(--text-tertiary)",
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: "3px",
        textDecorationColor: "var(--border-strong)",
      }}
    >
      ↺ Watch a day pass through the site
    </button>
  );
}
