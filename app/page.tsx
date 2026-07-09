import { Hero } from "@/components/scenes/Hero";
import { FeaturedWork } from "@/components/scenes/FeaturedWork";
import { AboutGlimpse } from "@/components/scenes/AboutGlimpse";
import { Current } from "@/components/scenes/Current";
import { Footer } from "@/components/scenes/Footer";

import { profile } from "@/content/profile";
import { projects } from "@/content/projects";

/*
 * Landing (/). Curated, not a dump: the shader hero, a glimpse of the work, a
 * couple of lines about, the live "current" panel, and contact. Everything
 * substantial lives on its own route (/projects, /about, /photography,
 * /journal), reached from here and from the nav.
 */
export default function Home() {
  return (
    <>
      <Hero statement={profile.heroStatement} />
      <div id="work">
        <FeaturedWork projects={projects} />
      </div>
      <AboutGlimpse profile={profile} />
      <Current profile={profile} />
      <Footer profile={profile} />
    </>
  );
}
