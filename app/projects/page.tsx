import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { Projects } from "@/components/scenes/Projects";
import { Footer } from "@/components/scenes/Footer";
import { projects } from "@/content/projects";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Projects — Coen",
  description: "Selected projects, built with care.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageIntro index="02" title="Projects" lead="Things made with care — click any panel to step inside." />
      <Projects projects={projects} hideHeader />
      <Footer profile={profile} />
    </>
  );
}
