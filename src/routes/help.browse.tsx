import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { GuideCardList } from "@/components/help/GuideCard";
import { HelpNotice, HelpSkeleton } from "@/components/help/HelpStates";
import { HelpSearchBox } from "@/components/help/HelpSearchBox";
import { publishedDeliveryQueries } from "@/lib/queries";

interface BrowseSearch {
  area?: string;
  /** Opaque delivery-layer context handle. Never parsed by the portal. */
  c?: string;
}

export const Route = createFileRoute("/help/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseSearch => {
    const area = search["area"];
    const context = search["c"];
    return {
      ...(typeof area === "string" && area ? { area } : {}),
      ...(typeof context === "string" && context ? { c: context } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Browse Aurumi Help — Apps, Tasks & Integrations" },
      {
        name: "description",
        content:
          "Browse published Aurumi guides by app and feature, topic and task, or integration and capability.",
      },
      { property: "og:title", content: "Browse Aurumi Help" },
      {
        property: "og:description",
        content: "Find published Aurumi guides by the area you are working in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const { area: areaId, c: contextKey } = Route.useSearch();
  const areas = useQuery(publishedDeliveryQueries.browseAreas());
  const context = useQuery(publishedDeliveryQueries.browseContext(contextKey ?? null));
  const contextGuides = useQuery(publishedDeliveryQueries.byRefKey(contextKey ?? null));

  const area = areas.data?.find((item) => item.areaId === areaId) ?? null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
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
        {area ? (
          <>
            <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
            <Link
              to="/help/browse"
              search={{ area: area.areaId }}
              className="text-muted-foreground hover:text-foreground"
            >
              {area.label}
            </Link>
          </>
        ) : null}
        {context.data ? (
          <>
            <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{context.data.label}</span>
          </>
        ) : null}
      </nav>

      <header className="mt-5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {context.data?.label ?? area?.label ?? "Browse help"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {context.data
            ? `Published guides for ${context.data.label}.`
            : (area?.description ?? "Pick an area to see the guides available for it.")}
        </p>
        <div className="mt-6 max-w-xl">
          <HelpSearchBox size="compact" />
        </div>
      </header>

      <div className="mt-10 space-y-10">
        {contextKey ? (
          context.isPending || contextGuides.isPending ? (
            <HelpSkeleton rows={2} />
          ) : contextGuides.data && contextGuides.data.length > 0 ? (
            <>
              <GuideCardList guides={contextGuides.data} />
              {context.data && context.data.children.length > 0 ? (
                <ContextList
                  title="Narrow it down"
                  areaId={areaId}
                  contexts={context.data.children}
                />
              ) : null}
            </>
          ) : (
            <HelpNotice
              title="We don't have a guide for this yet"
              description="Nothing has been published for this area so far. Try another area or search the full guide library."
            />
          )
        ) : areas.isPending ? (
          <HelpSkeleton rows={3} />
        ) : area ? (
          area.contexts.length > 0 ? (
            <ContextList title={area.label} areaId={area.areaId} contexts={area.contexts} />
          ) : (
            <HelpNotice
              title="We don't have a guide for this yet"
              description="Nothing has been published in this area so far."
            />
          )
        ) : areas.data && areas.data.length > 0 ? (
          <div className="space-y-10">
            {areas.data.map((item) => (
              <section key={item.areaId}>
                <h2 className="text-lg font-semibold text-foreground">{item.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-4">
                  <ContextList areaId={item.areaId} contexts={item.contexts} />
                </div>
              </section>
            ))}
          </div>
        ) : (
          <HelpNotice
            title="No help available yet"
            description="We don't have any published guides to show right now. Please check back soon."
            action={<span className="text-xs text-muted-foreground">Nothing published yet</span>}
          />
        )}
      </div>
    </div>
  );
}

function ContextList({
  title,
  areaId,
  contexts,
}: {
  title?: string;
  areaId?: string;
  contexts: Array<{
    refKey: string;
    label: string;
    kindLabel: string;
    totalPublishedGuideCount: number;
    children: Array<{ refKey: string; label: string; totalPublishedGuideCount: number }>;
  }>;
}) {
  return (
    <section>
      {title ? (
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {contexts.map((context) => (
          <li key={context.refKey}>
            <Link
              to="/help/browse"
              search={{ ...(areaId ? { area: areaId } : {}), c: context.refKey }}
              className="flex h-full items-start justify-between gap-3 rounded-xl border border-border/80 bg-help-surface p-5 shadow-help-card transition-all hover:border-border hover:shadow-md"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{context.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {context.totalPublishedGuideCount} guide
                  {context.totalPublishedGuideCount === 1 ? "" : "s"}
                  {context.children.length > 0
                    ? ` · ${context.children.length} area${context.children.length === 1 ? "" : "s"}`
                    : ""}
                </span>
              </span>
              <ChevronRight aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
