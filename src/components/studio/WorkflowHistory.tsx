import { useQuery } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingRows } from "@/components/studio/DataState";
import {
  GUIDE_STATUS_LABELS,
  GUIDE_WORKFLOW_EVENT_LABELS,
} from "@/domain/types";
import { formatDateTime } from "@/lib/format";
import { guideQueries } from "@/lib/queries";

/**
 * Read-only version-level workflow history (Build 2B).
 *
 * Minimal audit feed of Submitted for Review / Changes Requested / Approved.
 * Not a comment system: no threads, mentions or notifications.
 */
export function WorkflowHistory({ guideId }: { guideId: string }) {
  const events = useQuery(guideQueries.workflowEvents(guideId));

  return (
    <section className="panel">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Workflow history</h2>
        <p className="text-xs text-muted-foreground">
          GuideVersion lifecycle transitions recorded with each workflow action.
        </p>
      </div>
      {events.isPending ? (
        <LoadingRows rows={3} />
      ) : events.isError ? (
        <ErrorState message={(events.error as Error)?.message} onRetry={() => events.refetch()} />
      ) : events.data!.length === 0 ? (
        <EmptyState
          title="No workflow events yet"
          description="Submitting a draft for review records the first event."
        />
      ) : (
        <ul className="divide-y divide-border">
          {events.data!.map((event) => (
            <li key={event.id} className="px-4 py-2.5">
              <p className="text-sm font-medium">
                {GUIDE_WORKFLOW_EVENT_LABELS[event.action]}{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {GUIDE_STATUS_LABELS[event.fromStatus]} → {GUIDE_STATUS_LABELS[event.toStatus]}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {event.performedBy} · {formatDateTime(event.performedAt)}
              </p>
              {event.note ? (
                <p className="mt-1 rounded-md border border-dashed border-border bg-muted/40 px-2.5 py-1.5 text-xs">
                  “{event.note}”
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
