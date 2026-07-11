import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { Journal } from "@/components/scenes/Journal";
import { journal } from "@/content/journal";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes to self, in the open.",
};

export default function JournalPage() {
  return (
    <>
      <PageIntro index="04" title="Journal" lead="Notes to self, in the open." />
      <Journal entries={journal} hideHeader />
    </>
  );
}
