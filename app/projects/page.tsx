import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { Projects } from "@/components/scenes/Projects";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects — Coen",
  description: "Selected projects, built with care.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageIntro index="02" title="Projects" lead="Ideas built to matter. Open any panel to step inside." />
      <Projects projects={projects} hideHeader />
    </>
  );
}
