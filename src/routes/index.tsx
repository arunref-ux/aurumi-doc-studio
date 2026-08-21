import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { ErrorState, LoadingRows } from "@/components/studio/DataState";
import { PageHeader } from "@/components/studio/PageHeader";
import { StatusBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GUIDE_STATUS_LABELS,
  GUIDE_STATUS_ORDER,
  type CoverageBucket,
  type Guide,
} from "@/domain/types";
import { daysSince, formatDateTime, relativeDays } from "@/lib/format";
import { guideQueries } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Aurumi Guide Studio" },
      {
        name: "description",
        content:
          "Operational dashboard for Aurumi Help documentation: guide status, documentation coverage across DevHarmony features, AI intents and connector capabilities.",
      },
      { property: "og:title", content: "Dashboard — Aurumi Guide Studio" },
      {
        property: "og:description",
        content: "Documentation health, coverage gaps and recent guide activity for Aurumi Help.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const counts = useQuery(guideQueries.statusCounts());
  const coverage = useQuery(guideQueries.coverage());
  const activity = useQuery(guideQueries.recentActivity(8));
  const guides = useQuery(guideQueries.list());

  const refreshAll = () => {
    counts.refetch();
    coverage.refetch();
    activity.refetch();
    guides.refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Knowledge Operations"
        title="Documentation Health"
        description="Authoring and management system for Aurumi Help Guides. Guides are owned here; apps, features, AI intents and connector capabilities remain owned by their source systems."
        actions={
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        }
      />

      <section>
        <h2 className="label-caps mb-2.5">Guide inventory</h2>
        {counts.isError ? (
          <div className="panel">
            <ErrorState message={(counts.error as Error)?.message} onRetry={() => counts.refetch()} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Total Guides" value={counts.data?.total} loading={counts.isPending} emphasis />
            {GUIDE_STATUS_ORDER.map((status) => (
              <KpiCard
                key={status}
                label={GUIDE_STATUS_LABELS[status]}
                value={counts.data?.byStatus[status]}
                loading={counts.isPending}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="label-caps">Documentation coverage</h2>
          <Link to="/coverage" className="text-xs font-medium text-primary hover:underline">
            Coverage detail
          </Link>
        </div>
        {coverage.isError ? (
          <div className="panel">
            <ErrorState
              message={(coverage.error as Error)?.message}
              onRetry={() => coverage.refetch()}
            />
          </div>
        ) : coverage.isPending ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="panel p-4">
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            <CoverageCard bucket={coverage.data!.features} source="DevHarmony" />
            <CoverageCard bucket={coverage.data!.intents} source="Aurumi AI Studio" />
            <CoverageCard bucket={coverage.data!.capabilities} source="Connectors" />
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="panel">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Recent guide activity</h2>
            <span className="text-xs text-muted-foreground">Last 8 events</span>
          </div>
          {activity.isError ? (
            <ErrorState message={(activity.error as Error)?.message} onRetry={() => activity.refetch()} />
          ) : activity.isPending || guides.isPending ? (
            <LoadingRows rows={6} />
          ) : (
            <ul className="divide-y divide-border">
              {activity.data!.map((entry) => {
                const guide = guides.data?.find((item) => item.id === entry.guideId);
                return (
                  <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/library/$guideId"
                        params={{ guideId: entry.guideId }}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {guide?.title ?? entry.guideId}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.action}
                        {entry.detail ? ` · ${entry.detail}` : ""} · {entry.actor}
                      </p>
                    </div>
                    {guide ? <StatusBadge status={guide.status} /> : null}
                    <span className="hidden w-32 shrink-0 text-right text-xs text-muted-foreground sm:inline">
                      {formatDateTime(entry.at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Guides needing attention</h2>
          </div>
          {guides.isPending || coverage.isPending ? (
            <LoadingRows rows={5} />
          ) : (
            <AttentionList guides={guides.data ?? []} features={coverage.data?.features} />
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  loading,
  emphasis,
}: {
  label: string;
  value?: number | undefined;
  loading?: boolean | undefined;
  emphasis?: boolean | undefined;
}) {
  return (
    <div className="panel px-4 py-3">
      <p className="label-caps truncate">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-12" />
      ) : (
        <p
          className={
            emphasis
              ? "mt-1 text-3xl font-semibold tabular-nums text-foreground"
              : "mt-1 text-3xl font-semibold tabular-nums text-foreground/85"
          }
        >
          {value ?? 0}
        </p>
      )}
    </div>
  );
}

function CoverageCard({ bucket, source }: { bucket: CoverageBucket; source: string }) {
  const pct = bucket.total === 0 ? 0 : Math.round((bucket.covered / bucket.total) * 100);
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{bucket.label}</p>
          <p className="text-xs text-muted-foreground">Source system: {source}</p>
        </div>
        <p className="text-2xl font-semibold tabular-nums">{pct}%</p>
      </div>
      <Progress value={pct} className="mt-3 h-1.5" />
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-medium tabular-nums">{bucket.total}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Covered</dt>
          <dd className="font-medium tabular-nums text-status-published-foreground">{bucket.covered}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">No guide</dt>
          <dd className="font-medium tabular-nums text-status-review-foreground">{bucket.uncovered}</dd>
        </div>
      </dl>
      {bucket.uncoveredExamples.length > 0 ? (
        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
          Gaps: {bucket.uncoveredExamples.slice(0, 3).join(", ")}
          {bucket.uncoveredExamples.length > 3 ? ` +${bucket.uncoveredExamples.length - 3} more` : ""}
        </p>
      ) : null}
    </div>
  );
}

function AttentionList({
  guides,
  features,
}: {
  guides: Guide[];
  features?: CoverageBucket | undefined;
}) {
  const inReview = guides.filter((guide) => guide.status === "in-review");
  const staleDrafts = guides.filter(
    (guide) => guide.status === "draft" && daysSince(guide.updatedAt) > 45,
  );

  return (
    <div className="divide-y divide-border">
      <AttentionGroup title="In review" count={inReview.length}>
        {inReview.map((guide) => (
          <AttentionRow key={guide.id} guide={guide} note={`Updated ${relativeDays(guide.updatedAt)}`} />
        ))}
      </AttentionGroup>
      <AttentionGroup title="Drafts not updated recently" count={staleDrafts.length}>
        {staleDrafts.map((guide) => (
          <AttentionRow key={guide.id} guide={guide} note={`Updated ${relativeDays(guide.updatedAt)}`} />
        ))}
      </AttentionGroup>
      <AttentionGroup title="Features with no documentation" count={features?.uncovered ?? 0}>
        {(features?.uncoveredExamples ?? []).slice(0, 5).map((name) => (
          <li key={name} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
            <span className="truncate">{name}</span>
            <Link
              to="/sources"
              className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
            >
              Source <ArrowUpRight className="size-3" />
            </Link>
          </li>
        ))}
      </AttentionGroup>
    </div>
  );
}

function AttentionGroup({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-4 py-1">
        <p className="label-caps">{title}</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="px-4 py-2 text-xs text-muted-foreground">Nothing outstanding.</p>
      ) : (
        <ul>{children}</ul>
      )}
    </div>
  );
}

function AttentionRow({ guide, note }: { guide: Guide; note: string }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2">
      <div className="min-w-0">
        <Link
          to="/library/$guideId"
          params={{ guideId: guide.id }}
          className="block truncate text-sm font-medium hover:underline"
        >
          {guide.title}
        </Link>
        <p className="text-xs text-muted-foreground">
          {guide.owner} · {note}
        </p>
      </div>
      <StatusBadge status={guide.status} />
    </li>
  );
}
