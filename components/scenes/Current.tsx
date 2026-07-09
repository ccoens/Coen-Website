import type { Profile } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { Glass } from "@/components/ui/Glass";
import { stagger } from "@/lib/motion";

/*
 * Current scene (§13). Live states — reading / building / learning / listening /
 * travelling. Per the DECISION in §13 these cross-fade on scroll-into-view (via
 * Reveal), not on a timer, so nothing animates unprompted; reduced motion makes
 * it instant. A slow status dot signals liveness without demanding attention.
 * Server component with a Glass panel.
 */
export function Current({ profile }: { profile: Profile }) {
  return (
    <section id="current" className="scene" aria-labelledby="current-title">
      <div className="scene-inner">
        <SceneHeader
          title="Current"
          id="current-title"
          lead="Where my attention is, right now."
        />

        <Reveal>
          <Glass radius="lg" blur={18}>
            <div style={{ padding: "var(--space-4)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                  marginBottom: "var(--space-4)",
                }}
              >
                <span className="live-dot" aria-hidden />
                <span
                  className="type-caption"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Live
                </span>
              </div>

              <dl style={{ margin: 0 }}>
                {profile.current.map((item, i) => (
                  <Reveal
                    key={item.label}
                    delay={stagger.item(i)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(120px, 0.3fr) 1fr",
                      gap: "var(--space-3)",
                      alignItems: "baseline",
                      paddingBlock: "var(--space-2)",
                      borderTop:
                        i === 0 ? "none" : "1px solid var(--border)",
                    }}
                  >
                    <dt
                      className="type-caption"
                      style={{ textTransform: "uppercase", color: "var(--text-tertiary)" }}
                    >
                      {item.label}
                    </dt>
                    <dd className="type-body" style={{ margin: 0 }}>
                      {item.value}
                    </dd>
                  </Reveal>
                ))}
              </dl>
            </div>
          </Glass>
        </Reveal>
      </div>
    </section>
  );
}
