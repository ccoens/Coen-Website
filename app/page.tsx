import { Hero } from "@/components/scenes/Hero";
import { profile } from "@/content/profile";

export default function Page() {
  return (
    <>
      <Hero statement={profile.heroStatement} />
      {/* Scenes added incrementally below. */}
      <div style={{ height: "120vh" }} aria-hidden />
    </>
  );
}
