import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { About } from "@/components/scenes/About";
import { Current } from "@/components/scenes/Current";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "About",
  description:
    "I'm someone who wants to create a better experience for all, through safety and software.",
};

export default function AboutPage() {
  return (
    <>
      <PageIntro index="01" title="About" lead="I'm someone who wants to create a better experience for all, through safety and software." />
      <About profile={profile} hideHeader />
      <Current profile={profile} />
    </>
  );
}
