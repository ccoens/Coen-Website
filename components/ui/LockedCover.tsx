/*
 * LockedCover — the "Coming soon" fill shown in place of a cover image for
 * projects flagged `comingSoon`. A calm accent-washed panel with a padlock and
 * label, so a locked project reads as deliberate (held back), never unfinished.
 * Server-safe (no client hooks); used by both the projects grid and the
 * landing's featured strip.
 */
export function LockedCover() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg, var(--surface-solid), var(--accent-soft))",
      }}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--text-tertiary)" }}
      >
        <rect x="4" y="10.5" width="16" height="10" rx="2" />
        <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      </svg>
    </div>
  );
}
