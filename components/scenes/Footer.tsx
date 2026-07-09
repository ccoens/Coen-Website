import type { Profile } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { Magnetic } from "@/components/ui/Magnetic";

/*
 * Footer / Contact scene (§13). Minimal — an invitation, the email, and links.
 * The close of the canvas, so it breathes. Server component.
 */
export function Footer({ profile }: { profile: Profile }) {
  return (
    <footer
      id="contact"
      className="scene"
      aria-labelledby="contact-title"
      style={{ paddingBottom: "var(--space-9)" }}
    >
      <div className="scene-inner">
        <SceneHeader index="06" title="Contact" id="contact-title" />

        <div
          className="footer-grid"
          style={{
            display: "grid",
            gap: "var(--space-6)",
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
        >
          <div>
            <Reveal>
              <p
                className="type-h2"
                style={{
                  fontSize: "clamp(28px, 4vw, 56px)",
                  maxWidth: "16ch",
                  marginBottom: "var(--space-4)",
                }}
              >
                Let&rsquo;s make something considered.
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <Magnetic strength={0.25}>
                <a
                  href={`mailto:${profile.email}`}
                  data-cursor="interactive"
                  className="type-h3"
                  style={{
                    color: "var(--accent)",
                    textDecoration: "none",
                    fontWeight: 500,
                    wordBreak: "break-word",
                  }}
                >
                  {profile.email}
                </a>
              </Magnetic>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-3)",
              }}
            >
              {profile.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="type-body"
                    style={{
                      color: "var(--text-secondary)",
                      textDecoration: "none",
                    }}
                  >
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.14}>
          <p
            className="type-caption"
            style={{
              marginTop: "var(--space-9)",
              paddingTop: "var(--space-3)",
              borderTop: "1px solid var(--border)",
            }}
          >
            © {new Date().getFullYear()} Coen · coen.life · Built as a continuous
            spatial interface.
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
