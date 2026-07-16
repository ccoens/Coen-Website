"use client";

/*
 * StarSketchTrigger — the quiet doorway into the star-drawing studio. Lives in
 * the footer beside the dossier link; dispatches the event StarSketch listens
 * for. Understated on purpose — it's a thing to be found.
 */
export function StarSketchTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("coen:starsketch"))}
      data-cursor="interactive"
      className="type-caption"
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        marginTop: 4,
        color: "var(--text-secondary)",
        cursor: "pointer",
        textAlign: "left",
        textDecoration: "underline",
        textUnderlineOffset: "3px",
        textDecorationColor: "var(--border-strong)",
      }}
    >
      Draw your own constellation ✷
    </button>
  );
}
