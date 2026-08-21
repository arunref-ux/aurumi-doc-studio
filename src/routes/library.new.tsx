import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthorization } from "@/auth/AuthorizationContext";
import { EmptyState } from "@/components/studio/DataState";
import { GuideWorkspace } from "@/components/studio/GuideWorkspace";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/library/new")({
  head: () => ({
    meta: [
      { title: "Create Guide — Aurumi Guide Studio" },
      {
        name: "description",
        content:
          "Create a new Aurumi Help Guide with its initial draft version and source associations.",
      },
      { property: "og:title", content: "Create Guide — Aurumi Guide Studio" },
      {
        property: "og:description",
        content: "Author a new guide draft and associate it with DevHarmony, AI Studio and connector entities.",
      },
    ],
  }),
  component: CreateGuidePage,
});

function CreateGuidePage() {
  const { canRunAction, isLoading } = useAuthorization();

  if (isLoading) return null;

  // Route-level gate; the command bus enforces guide.create independently.
  if (!canRunAction("guide.action.create")) {
    return (
      <div className="panel">
        <EmptyState
          title="You cannot create guides"
          description="Guide creation requires the guide.create permission."
        />
        <div className="flex justify-center pb-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/library">Back to Guide Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <GuideWorkspace />;
}
