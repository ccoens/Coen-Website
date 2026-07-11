"use client";

/*
 * DossierTrigger — the quiet doorway into the dossier. Lives in the footer;
 * dispatches the window event the Dossier listens for. Kept understated: the
 * offer to show what the site has noticed is itself part of the intrigue.
 */
export function DossierTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("coen:dossier"))}
      data-cursor="interactive"
      className="type-caption"
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        marginTop: 6,
        color: "var(--text-secondary)",
        cursor: "pointer",
        textAlign: "left",
        textDecoration: "underline",
        textUnderlineOffset: "3px",
        textDecorationColor: "var(--border-strong)",
      }}
    >
      What this page has quietly noticed about you ↗
    </button>
  );
}
