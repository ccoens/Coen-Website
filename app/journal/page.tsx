import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { Journal } from "@/components/scenes/Journal";
import { Footer } from "@/components/scenes/Footer";
import { journal } from "@/content/journal";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Journal — Coen",
  description: "Notes to self, in the open.",
};

export default function JournalPage() {
  return (
    <>
      <PageIntro index="04" title="Journal" lead="Notes to self, in the open." />
      <Journal entries={journal} hideHeader />
      <Footer profile={profile} />
    </>
  );
}
