import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { AskAuraTeaser } from "@/components/help/AskAuraTeaser";
import { GuideCardList } from "@/components/help/GuideCard";
import { HelpNotice, HelpSkeleton } from "@/components/help/HelpStates";
import { HelpSearchBox } from "@/components/help/HelpSearchBox";
import { publishedDeliveryQueries } from "@/lib/queries";

export const Route = createFileRoute("/help/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search.q === "string" && search.q ? { q: search.q } : {},
  head: () => ({
    meta: [
      { title: "Search Aurumi Help" },
      {
        name: "description",
        content:
          "Search published Aurumi guides by title, summary and guide content. Only currently published help is searchable.",
      },
      { property: "og:title", content: "Search Aurumi Help" },
      {
        property: "og:description",
        content: "Find published Aurumi guides by keyword.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const query = q ?? "";
  const results = useQuery(publishedDeliveryQueries.search(query));
  const hits = results.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
        <Link to="/help" className="text-muted-foreground hover:text-foreground">
          Help
        </Link>
        <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">Search</span>
      </nav>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Search help
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Keyword search across published guide titles, summaries and content.
      </p>

      <div className="mt-6">
        <HelpSearchBox initialQuery={query} autoFocus />
      </div>

      <div className="mt-10 space-y-8">
        {!query.trim() ? (
          <HelpNotice
            title="What are you looking for?"
            description="Type a few words above — for example the name of a feature, a task or an integration — or browse help by area."
          />
        ) : results.isPending ? (
          <HelpSkeleton rows={2} />
        ) : hits.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              {hits.length} guide{hits.length === 1 ? "" : "s"} matching{" "}
              <span className="font-medium text-foreground">“{query}”</span>
            </p>
            <GuideCardList guides={hits.map((hit) => hit.guide)} />
          </>
        ) : (
          <HelpNotice
            title="No guides matched your search"
            description={`We couldn't find published help for “${query}”. Try a different wording, or browse help by area.`}
          />
        )}

        <AskAuraTeaser />
      </div>
    </div>
  );
}
