import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { About } from "@/components/scenes/About";
import { Current } from "@/components/scenes/Current";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "About — Coen",
  description: "A person thinking and building in public.",
};

export default function AboutPage() {
  return (
    <>
      <PageIntro index="01" title="About" lead="A person thinking and building in public." />
      <About profile={profile} hideHeader />
      <Current profile={profile} />
    </>
  );
}
