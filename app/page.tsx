import { Hero } from "@/components/scenes/Hero";
import { CanberraTime } from "@/components/scenes/CanberraTime";
import { FeaturedWork } from "@/components/scenes/FeaturedWork";
import { AboutGlimpse } from "@/components/scenes/AboutGlimpse";
import { Current } from "@/components/scenes/Current";
import { VisitorLine } from "@/components/scenes/VisitorLine";
import { FooterSigil } from "@/components/system/FooterSigil";

import { profile } from "@/content/profile";
import { projects } from "@/content/projects";

/*
 * Landing (/). Curated: the shader hero, then the big live "Time in Canberra"
 * beat, a glimpse of the work, a couple of lines about, and the live "current"
 * panel. Everything substantial lives on its own route.
 */
export default function Home() {
  return (
    <>
      <Hero statement={profile.heroStatement} />
      <CanberraTime />
      <div id="work">
        <FeaturedWork projects={projects} />
      </div>
      <AboutGlimpse profile={profile} />
      <Current profile={profile} />
      <section
        aria-label="A line just for you"
        className="scene-inner"
        style={{ paddingBlock: "var(--space-8)" }}
      >
        <VisitorLine />
      </section>
      <footer
        className="scene-inner"
        style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-9)" }}
      >
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "var(--space-4)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "var(--space-4)",
          }}
        >
          <p className="type-caption">
            © {new Date().getFullYear()} Coen · coen.life · Built as a continuous
            spatial interface.
          </p>
          <FooterSigil />
        </div>
      </footer>
    </>
  );
}
