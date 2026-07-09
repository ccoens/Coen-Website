import { Hero } from "@/components/scenes/Hero";
import { CanberraTime } from "@/components/scenes/CanberraTime";
import { FeaturedWork } from "@/components/scenes/FeaturedWork";
import { AboutGlimpse } from "@/components/scenes/AboutGlimpse";
import { Current } from "@/components/scenes/Current";

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
    </>
  );
}
