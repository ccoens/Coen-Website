"use client";

import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/content/types";
import { SceneHeader } from "@/components/ui/SceneHeader";
import {
  ExhibitionPanel,
  ProjectExpansion,
} from "@/components/ui/ExhibitionPanel";

/*
 * Projects scene (§13). A grid of exhibition panels; opening one expands it in
 * place. The active project id is mirrored to the URL (?project=id) via the
 * History API WITHOUT remounting, so a shared link deep-links straight to the
 * open project with no visual cut. Back/forward also work.
 */
export function Projects({
  projects,
  hideHeader = false,
}: {
  projects: Project[];
  hideHeader?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Locked (coming-soon) projects never open, even via a hand-typed ?project= URL.
  const active = projects.find((p) => p.id === activeId && !p.comingSoon) ?? null;

  // Restore from the URL on mount, and follow browser back/forward.
  useEffect(() => {
    const sync = () => {
      const id = new URLSearchParams(window.location.search).get("project");
      const openable = projects.some((p) => p.id === id && !p.comingSoon);
      setActiveId(openable ? id : null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [projects]);

  const open = useCallback((id: string) => {
    setActiveId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("project", id);
    window.history.pushState({ project: id }, "", url);
  }, []);

  const close = useCallback(() => {
    setActiveId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    window.history.pushState({}, "", url);
  }, []);

  return (
    <section id="projects" className="scene" aria-labelledby="projects-title">
      <div className="scene-inner">
        {!hideHeader && (
          <SceneHeader
            index="02"
            title="Projects"
            id="projects-title"
            lead="Things made with care."
          />
        )}

        <div
          className="projects-grid"
          style={{
            display: "grid",
            gap: "var(--space-4)",
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
        >
          {projects.map((p) => (
            <ExhibitionPanel
              key={p.id}
              project={p}
              onOpen={open}
              isActive={activeId === p.id}
            />
          ))}
        </div>
      </div>

      <ProjectExpansion project={active} onClose={close} />
    </section>
  );
}
