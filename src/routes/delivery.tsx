import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Radio } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingRows } from "@/components/studio/DataState";
import { PageHeader } from "@/components/studio/PageHeader";
import { SourceChip } from "@/components/studio/SourceChip";
import { MarkdownPreview } from "@/components/studio/content/MarkdownPreview";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublishedGuideRefQuery } from "@/delivery/interfaces";
import { REFERENCE_KIND_LABELS } from "@/domain/external-ref";
import { GUIDE_TYPE_LABELS, type SourceSystem } from "@/domain/types";
import { formatDate } from "@/lib/format";
import { publishedDeliveryQueries } from "@/lib/queries";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Published Delivery Layer — Aurumi Guide Studio" },
      {
        name: "description",
        content:
          "Internal architectural demonstration of the read-only Published Guide Delivery contract that future Help consumers will use.",
      },
      { property: "og:title", content: "Published Delivery Layer — Aurumi Guide Studio" },
      {
        property: "og:description",
        content:
          "Read-only published guide retrieval: published version resolution and contextual lookup by composite source reference.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeliveryPage,
});

function DeliveryPage() {
  const published = useQuery(publishedDeliveryQueries.list());
  const targets = useQuery(publishedDeliveryQueries.associationTargets());
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [selectedRefKey, setSelectedRefKey] = useState<string | null>(null);

  const detail = useQuery(publishedDeliveryQueries.detail(selectedGuideId));

  const refQuery: PublishedGuideRefQuery | null = useMemo(() => {
    const target = targets.data?.find((item) => item.refKey === selectedRefKey);
    if (!target) return null;
    return {
      source: target.ref.source,
      kind: target.ref.kind,
      externalId: target.ref.externalId,
    };
  }, [targets.data, selectedRefKey]);

  const contextual = useQuery(publishedDeliveryQueries.byAssociation(refQuery));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Build 3A · Internal"
        title="Published Delivery Layer"
        description="Architectural demonstration surface — not the Help Portal. Everything below is read through the Published Guide Delivery contract: only guides whose publishedVersionId resolves to a Published GuideVersion of the same guide are consumable. Drafts, in-review, approved-but-unpublished and archived versions never appear."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void published.refetch();
              void targets.refetch();
            }}
          >
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        }
      />

      <section className="rounded-lg border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Published guides</h2>
            <p className="text-xs text-muted-foreground">
              listPublishedGuides() · deterministic title-ascending ordering
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {published.data?.length ?? 0} consumable
          </span>
        </header>

        {published.isPending ? (
          <LoadingRows />
        ) : published.isError ? (
          <ErrorState onRetry={() => void published.refetch()} />
        ) : published.data && published.data.length > 0 ? (
          <ul className="divide-y divide-border">
            {published.data.map((guide) => (
              <li key={guide.guideId}>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedGuideId((current) =>
                      current === guide.guideId ? null : guide.guideId,
                    )
                  }
                  className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{guide.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {guide.summary}
                    </p>
                  </div>
                  <div className="shrink-0 space-y-1 text-right">
                    <p className="font-mono text-xs">v{guide.versionNumber}</p>
                    <p className="text-[0.6875rem] text-muted-foreground">
                      {guide.associations.length} association
                      {guide.associations.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </button>

                {selectedGuideId === guide.guideId ? (
                  <div className="border-t border-dashed border-border bg-muted/20 px-4 py-4">
                    {detail.isPending ? (
                      <LoadingRows rows={2} className="p-0" />
                    ) : detail.data ? (
                      <div className="space-y-4">
                        <dl className="grid gap-3 text-xs sm:grid-cols-4">
                          <Meta label="Guide type" value={GUIDE_TYPE_LABELS[detail.data.guideType]} />
                          <Meta label="Published version" value={`v${detail.data.versionNumber}`} />
                          <Meta label="Published" value={formatDate(detail.data.publishedAt)} />
                          <Meta label="Published by" value={detail.data.publishedBy} />
                        </dl>

                        <div>
                          <p className="mb-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
                            Source references
                          </p>
                          {detail.data.associations.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No associations.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {detail.data.associations.map((association) => (
                                <SourceChip
                                  key={`${association.ref.source}-${association.ref.kind}-${association.ref.externalId}`}
                                  source={association.ref.source as SourceSystem}
                                >
                                  {REFERENCE_KIND_LABELS[association.ref.kind]} ·{" "}
                                  {association.label}
                                </SourceChip>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="mb-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
                            Canonical published Markdown (rendered safely)
                          </p>
                          <div className="rounded-md border border-border bg-surface p-4">
                            <MarkdownPreview markdown={detail.data.contentMarkdown} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        title="Not consumable"
                        description="The delivery layer failed closed for this guide."
                      />
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No published guides" />
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Contextual lookup</h2>
          <p className="text-xs text-muted-foreground">
            getPublishedGuidesByAssociation({"{ source, kind, externalId }"}) · composite identity
            only, never a bare external id
          </p>
        </header>

        <div className="space-y-4 p-4">
          <Select
            value={selectedRefKey ?? undefined}
            onValueChange={(value) => setSelectedRefKey(value)}
          >
            <SelectTrigger className="max-w-lg">
              <SelectValue placeholder="Select a source reference" />
            </SelectTrigger>
            <SelectContent>
              {(targets.data ?? []).map((target) => (
                <SelectItem key={target.refKey} value={target.refKey}>
                  {REFERENCE_KIND_LABELS[target.ref.kind]} · {target.label} (
                  {target.publishedGuideCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {refQuery ? (
            <div className="space-y-2">
              <p className="font-mono text-[0.6875rem] text-muted-foreground">
                {refQuery.source}::{refQuery.kind}::{refQuery.externalId}
              </p>
              {contextual.isPending ? (
                <LoadingRows rows={2} className="p-0" />
              ) : contextual.data && contextual.data.length > 0 ? (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {contextual.data.map((guide) => (
                    <li
                      key={guide.guideId}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate">{guide.title}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        v{guide.versionNumber}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No published Help for this reference"
                  description="Zero, one or many published guides may match a target."
                />
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Radio className="size-3.5" /> Pick a reference to see every published guide that
              future consumers would retrieve for it.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-xs font-medium">{value}</dd>
    </div>
  );
}
