import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/studio/DataState";
import { PageHeader } from "@/components/studio/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoverageBucket } from "@/domain/types";
import { coverageQueries } from "@/lib/queries";

export const Route = createFileRoute("/coverage")({
  head: () => ({
    meta: [
      { title: "Documentation Coverage — Aurumi Guide Studio" },
      {
        name: "description",
        content:
          "High-level documentation coverage across DevHarmony features, Aurumi AI Studio intents and connector capabilities.",
      },
      { property: "og:title", content: "Documentation Coverage — Aurumi Guide Studio" },
      {
        property: "og:description",
        content: "Where Aurumi Help documentation exists and where the gaps are.",
      },
    ],
  }),
  component: CoveragePage,
});

function CoveragePage() {
  const coverage = useQuery(coverageQueries.summary());

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Insights"
        title="Documentation Coverage"
        description="Coverage is composed live from source-system provider hierarchies and Guide Studio guide versions. Published means at least one published version; in progress means authored but not yet published; archived versions never count as coverage."
        actions={
          <Button variant="outline" size="sm" onClick={() => coverage.refetch()}>
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        }
      />

      <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <Clock className="size-3.5" /> Coming later
        </span>{" "}
        · Drill-down by app, per-owner gap assignment, coverage trends and export.
      </div>

      {coverage.isError ? (
        <div className="panel">
          <ErrorState message={(coverage.error as Error)?.message} onRetry={() => coverage.refetch()} />
        </div>
      ) : coverage.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="panel p-4">
              <Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <CoveragePanel bucket={coverage.data!.features} source="DevHarmony" entity="Feature" />
          <CoveragePanel bucket={coverage.data!.intents} source="Aurumi AI Studio" entity="Intent" />
          <CoveragePanel
            bucket={coverage.data!.capabilities}
            source="Connector registry"
            entity="Capability"
          />
        </div>
      )}
    </div>
  );
}

function CoveragePanel({
  bucket,
  source,
  entity,
}: {
  bucket: CoverageBucket;
  source: string;
  entity: string;
}) {
  const publishedPct = bucket.total === 0 ? 0 : Math.round((bucket.published / bucket.total) * 100);
  const notStarted = bucket.entities.filter((item) => item.state === "not-started");
  const inProgress = bucket.entities.filter((item) => item.state === "in-progress");

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">{bucket.label}</h2>
          <p className="text-xs text-muted-foreground">
            Owned by {source} · {entity} entities referenced by guide versions
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold tabular-nums">{publishedPct}%</p>
          <p className="text-xs text-muted-foreground">
            {bucket.published} of {bucket.total} with published coverage
          </p>
        </div>
      </div>
      <Progress value={publishedPct} className="mt-4 h-2" />
      <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Published coverage</dt>
          <dd className="text-lg font-semibold tabular-nums text-status-published-foreground">
            {bucket.published}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">In progress (authoring only)</dt>
          <dd className="text-lg font-semibold tabular-nums text-status-review-foreground">
            {bucket.inProgress}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Not started</dt>
          <dd className="text-lg font-semibold tabular-nums">{bucket.notStarted}</dd>
        </div>
      </dl>

      {inProgress.length > 0 ? (
        <div className="mt-4">
          <p className="label-caps mb-2">{inProgress.length} documented but unpublished</p>
          <ul className="flex flex-wrap gap-1.5">
            {inProgress.map((item) => (
              <li
                key={`${item.ref.source}-${item.ref.kind}-${item.ref.externalId}`}
                className="rounded-md border border-status-review bg-status-review px-2 py-1 text-xs text-status-review-foreground"
              >
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {notStarted.length > 0 ? (
        <div className="mt-4">
          <p className="label-caps mb-2">{notStarted.length} without any guide coverage</p>
          <ul className="flex flex-wrap gap-1.5">
            {notStarted.map((item) => (
              <li
                key={`${item.ref.source}-${item.ref.kind}-${item.ref.externalId}`}
                className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                {item.name}
              </li>
            ))}
          </ul>
          <Link
            to="/sources"
            className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
          >
            Inspect in Sources
          </Link>
        </div>
      ) : (
        <p className="mt-4 text-xs text-status-published-foreground">
          Every {entity.toLowerCase()} has at least one associated guide.
        </p>
      )}
    </section>
  );
}
