import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthorization } from "@/auth/AuthorizationContext";
import { EmptyState, ErrorState, LoadingRows } from "@/components/studio/DataState";
import { GuideWorkspace } from "@/components/studio/GuideWorkspace";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { versionIsEditable } from "@/domain/guide-editing";
import { guideQueries } from "@/lib/queries";

export const Route = createFileRoute("/library/edit/$guideId")({
  head: () => ({
    meta: [
      { title: "Edit Draft Guide — Aurumi Guide Studio" },
      {
        name: "description",
        content: "Edit draft guide metadata and external source associations in Aurumi Guide Studio.",
      },
      { property: "og:title", content: "Edit Draft Guide — Aurumi Guide Studio" },
      {
        property: "og:description",
        content: "Update the title, summary and associations of a draft Aurumi Help Guide.",
      },
    ],
  }),
  component: EditGuidePage,
});

function EditGuidePage() {
  const { guideId } = Route.useParams();
  const { canRunAction, isLoading } = useAuthorization();
  const guide = useQuery(guideQueries.detail(guideId));

  if (isLoading || guide.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="panel">
          <LoadingRows rows={6} />
        </div>
      </div>
    );
  }

  if (guide.isError) {
    return (
      <div className="panel">
        <ErrorState message={(guide.error as Error)?.message} onRetry={() => guide.refetch()} />
      </div>
    );
  }

  if (!guide.data) {
    return (
      <div className="panel">
        <EmptyState title="Guide not found" description="This guide may have been removed." />
      </div>
    );
  }

  // Route-level gate; the command bus re-checks guide.edit on every mutation.
  if (!canRunAction("guide.action.edit")) {
    return (
      <Blocked
        guideId={guideId}
        title="You cannot edit this guide"
        description="Editing requires the guide.edit permission."
      />
    );
  }

  if (!versionIsEditable(guide.data.currentVersion)) {
    return (
      <Blocked
        guideId={guideId}
        title="Only draft versions are editable"
        description={`The current version is ${guide.data.currentVersion.status}. Lifecycle transitions arrive in a later build.`}
      />
    );
  }

  return <GuideWorkspace guide={guide.data} />;
}

function Blocked({
  guideId,
  title,
  description,
}: {
  guideId: string;
  title: string;
  description: string;
}) {
  return (
    <div className="panel">
      <EmptyState title={title} description={description} />
      <div className="flex justify-center pb-6">
        <Button asChild variant="outline" size="sm">
          <Link to="/library/$guideId" params={{ guideId }}>
            Back to Guide
          </Link>
        </Button>
      </div>
    </div>
  );
}
