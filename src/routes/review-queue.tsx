import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { EmptyState, ErrorState, LoadingRows } from "@/components/studio/DataState";
import { PageHeader } from "@/components/studio/PageHeader";
import { StatusBadge } from "@/components/studio/StatusBadge";
import {
  GUIDE_STATUS_LABELS,
  GUIDE_STATUS_ORDER,
  GUIDE_TYPE_LABELS,
  type Guide,
} from "@/domain/types";
import { formatDate, relativeDays } from "@/lib/format";
import { guideQueries } from "@/lib/queries";

export const Route = createFileRoute("/review-queue")({
  head: () => ({
    meta: [
      { title: "Review Queue — Aurumi Guide Studio" },
      {
        name: "description",
        content:
          "Status summary of Aurumi Help Guides waiting for review or approval ahead of the review workflow build.",
      },
      { property: "og:title", content: "Review Queue — Aurumi Guide Studio" },
      {
        property: "og:description",
        content: "Guides currently in review or approved and awaiting publication.",
      },
    ],
  }),
  component: ReviewQueuePage,
});

function ReviewQueuePage() {
  const counts = useQuery(guideQueries.statusCounts());
  const pending = useQuery(guideQueries.list({ status: "in-review" }));
  const approved = useQuery(guideQueries.list({ status: "approved" }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Lifecycle"
        title="Review Queue"
        description="Read-only status summary for Build 1. Review comments, approvals and publishing actions are added in a later build."
      />

      <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <Clock className="size-3.5" /> Coming later
        </span>{" "}
        · Submit for review, reviewer assignment, comment threads, approval and publish actions.
      </div>

      <section>
        <h2 className="label-caps mb-2.5">Status summary</h2>
        {counts.isError ? (
          <div className="panel">
            <ErrorState message={(counts.error as Error)?.message} onRetry={() => counts.refetch()} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {GUIDE_STATUS_ORDER.map((status) => (
              <div key={status} className="panel px-4 py-3">
                <p className="label-caps">{GUIDE_STATUS_LABELS[status]}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {counts.isPending ? "—" : counts.data?.byStatus[status] ?? 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <QueueSection
        title="In review"
        description="Awaiting reviewer sign-off."
        query={pending}
      />
      <QueueSection
        title="Approved, awaiting publish"
        description="Content approved; publishing is not available in Build 1."
        query={approved}
      />
    </div>
  );
}

function QueueSection({
  title,
  description,
  query,
}: {
  title: string;
  description: string;
  query: UseQueryResult<Guide[], Error>;
}) {
  const guides = query.data ?? [];

  return (
    <section className="panel">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {query.isError ? (
        <ErrorState message={query.error?.message} onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <LoadingRows rows={3} />
      ) : guides.length === 0 ? (
        <EmptyState title="Queue is empty" />
      ) : (
        <ul className="divide-y divide-border">
          {guides.map((guide) => (
            <li key={guide.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <div className="min-w-48 flex-1">
                <Link
                  to="/library/$guideId"
                  params={{ guideId: guide.id }}
                  className="text-sm font-medium hover:underline"
                >
                  {guide.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {GUIDE_TYPE_LABELS[guide.guideType]} · {guide.owner}
                </p>
              </div>
              <StatusBadge status={guide.status} />
              <span className="w-40 text-right text-xs text-muted-foreground">
                {formatDate(guide.updatedAt)} · {relativeDays(guide.updatedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
