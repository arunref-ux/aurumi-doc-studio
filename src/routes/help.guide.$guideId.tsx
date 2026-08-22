import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { AskAuraTeaser } from "@/components/help/AskAuraTeaser";
import { GuideCard } from "@/components/help/GuideCard";
import { HelpNotice } from "@/components/help/HelpStates";
import { MarkdownPreview } from "@/components/studio/content/MarkdownPreview";
import { REFERENCE_KIND_LABELS } from "@/domain/external-ref";
import { GUIDE_TYPE_LABELS } from "@/domain/types";
import { publishedDeliveryQueries } from "@/lib/queries";

export const Route = createFileRoute("/help/guide/$guideId")({
  head: () => ({
    meta: [
      { title: "Guide — Aurumi Help" },
      {
        name: "description",
        content: "Read a published Aurumi help guide, rendered from its currently live version.",
      },
      { property: "og:title", content: "Guide — Aurumi Help" },
      {
        property: "og:description",
        content: "A published, step-by-step Aurumi help guide.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuideReadingPage,
});

function GuideReadingPage() {
  const { guideId } = Route.useParams();
  // Delivery layer owns published resolution: currentVersionId is never used.
  const guide = useQuery(publishedDeliveryQueries.detail(guideId));
  const related = useQuery(publishedDeliveryQueries.related(guideId));

  if (guide.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        <div className="h-8 w-2/3 animate-pulse rounded-md bg-muted" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  // Fail closed: an invalid or missing published pointer looks the same to
  // readers as a guide that does not exist. No draft fallback, no diagnostics.
  if (!guide.data) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        <HelpNotice
          title="This guide is not currently available"
          description="It may have been moved or is no longer published. Browse the available guides or search for something else."
        />
      </div>
    );
  }

  const published = guide.data;
  const relatedGuides = related.data ?? [];

  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
        <Link to="/help" className="text-muted-foreground hover:text-foreground">
          Help
        </Link>
        <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
        <Link
          to="/help/browse"
          search={{}}
          className="text-muted-foreground hover:text-foreground"
        >
          Browse
        </Link>
        <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
        <span className="min-w-0 truncate font-medium text-foreground">{published.title}</span>
      </nav>

      <header className="mt-6 border-b border-border/70 pb-8">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
          {GUIDE_TYPE_LABELS[published.guideType]}
        </p>
        <h1 className="mt-2.5 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {published.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{published.summary}</p>
        <p className="mt-5 text-xs text-muted-foreground">Version {published.versionNumber}</p>

        {published.associations.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {published.associations.map((association) => (
              <Link
                key={`${association.ref.source}-${association.ref.kind}-${association.ref.externalId}`}
                to="/help/browse"
                search={{ c: refKeyOf(association.ref) }}
                className="rounded-full border border-border bg-help-surface px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {REFERENCE_KIND_LABELS[association.ref.kind]} · {association.label}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      <div className="help-prose mt-8">
        {/* Reuses the shared safe Markdown pipeline: sanitized HTML, http(s)-only images, safe embeds. */}
        <MarkdownPreview
          markdown={published.contentMarkdown}
          emptyState="This guide does not have any published content yet."
        />
      </div>

      {relatedGuides.length > 0 ? (
        <section className="mt-14 border-t border-border/70 pt-10">
          <h2 className="text-lg font-semibold text-foreground">Related guides</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Other published guides for the same areas.
          </p>
          <div className="mt-5 grid gap-4">
            {relatedGuides.slice(0, 4).map((item) => (
              <GuideCard key={item.guideId} guide={item} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-12">
        <AskAuraTeaser />
      </div>
    </article>
  );
}

/** Opaque handle for a browse link; the portal never interprets its parts. */
function refKeyOf(ref: { source: string; kind: string; externalId: string }): string {
  return `${ref.source}::${ref.kind}::${ref.externalId}`;
}
