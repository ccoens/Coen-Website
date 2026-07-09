import { Hero } from "@/components/scenes/Hero";
import { About } from "@/components/scenes/About";
import { Projects } from "@/components/scenes/Projects";
import { Photography } from "@/components/scenes/Photography";
import { Journal } from "@/components/scenes/Journal";
import { Current } from "@/components/scenes/Current";
import { Footer } from "@/components/scenes/Footer";

import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { photos } from "@/content/photos";
import { journal } from "@/content/journal";

/*
 * The single canvas (§13). Scenes compose in order; there are no routes and no
 * remounts — navigation is camera-like movement through this one page. Scenes
 * are dumb and take their data as props; all the ambient systems (background,
 * light, cursor, the morphing logo, nav) live in AppShell around this.
 */
export default function Page() {
  return (
    <>
      <Hero statement={profile.heroStatement} />
      <About profile={profile} />
      <Projects projects={projects} />
      <Photography photos={photos} />
      <Journal entries={journal} />
      <Current profile={profile} />
      <Footer profile={profile} />
    </>
  );
}
