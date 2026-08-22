import { Link } from "@tanstack/react-router";
import { ArrowUpRight, FileText } from "lucide-react";
import type { PublishedGuide } from "@/domain/published-guide";
import { GUIDE_TYPE_LABELS } from "@/domain/types";

/**
 * Consumer-facing guide preview. Shows only published, reader-relevant facts:
 * no workflow status, no approval trail, no authoring metadata.
 */
export function GuideCard({ guide }: { guide: PublishedGuide }) {
  return (
    <Link
      to="/help/guide/$guideId"
      params={{ guideId: guide.guideId }}
      className="group block rounded-xl border border-border/80 bg-help-surface p-5 shadow-help-card transition-all hover:border-border hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
            <FileText className="size-3.5" />
            {GUIDE_TYPE_LABELS[guide.guideType]}
          </p>
          <h3 className="mt-2 text-lg font-semibold leading-snug text-foreground">{guide.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{guide.summary}</p>
        </div>
        <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Version {guide.versionNumber}</p>
    </Link>
  );
}

export function GuideCardList({ guides }: { guides: PublishedGuide[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {guides.map((guide) => (
        <GuideCard key={guide.guideId} guide={guide} />
      ))}
    </div>
  );
}
