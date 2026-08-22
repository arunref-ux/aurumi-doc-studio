import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Compass } from "lucide-react";
import { AskAuraTeaser } from "@/components/help/AskAuraTeaser";
import { GuideCardList } from "@/components/help/GuideCard";
import { HelpNotice, HelpSkeleton } from "@/components/help/HelpStates";
import { HelpSearchBox } from "@/components/help/HelpSearchBox";
import { publishedDeliveryQueries } from "@/lib/queries";

export const Route = createFileRoute("/help/")({
  head: () => ({
    meta: [
      { title: "Aurumi Help — Guides & How-tos" },
      {
        name: "description",
        content:
          "Search or browse Aurumi Help: published step-by-step guides for apps, features, tasks and integrations.",
      },
      { property: "og:title", content: "Aurumi Help — Guides & How-tos" },
      {
        property: "og:description",
        content: "Find published Aurumi guides by search, or browse by app, task or integration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpHome,
});

function HelpHome() {
  const areas = useQuery(publishedDeliveryQueries.browseAreas());
  const guides = useQuery(publishedDeliveryQueries.list());
  const featured = (guides.data ?? []).slice(0, 4);

  return (
    <div>
      <section className="border-b border-border/70 bg-[image:var(--help-hero)] px-5 py-16 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-sidebar-foreground sm:text-5xl">
            How can we help?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-sidebar-muted sm:text-base">
            Search the Aurumi guide library, or browse help by app, task or integration.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <HelpSearchBox />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-14 px-5 py-14 sm:px-8">
        <section>
          <header className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Browse help
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Start from the area you are working in.
            </p>
          </header>

          {areas.isPending ? (
            <HelpSkeleton rows={3} />
          ) : areas.data && areas.data.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {areas.data.map((area) => (
                <Link
                  key={area.areaId}
                  to="/help/browse"
                  search={{ area: area.areaId }}
                  className="group flex flex-col rounded-xl border border-border/80 bg-help-surface p-6 shadow-help-card transition-all hover:border-border hover:shadow-md"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Compass className="size-4" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{area.label}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {area.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    {area.totalPublishedGuideCount} guide
                    {area.totalPublishedGuideCount === 1 ? "" : "s"}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <HelpNotice
              title="No help available yet"
              description="We don't have any published guides to show right now. Please check back soon."
              action={<span className="text-xs text-muted-foreground">Nothing published yet</span>}
            />
          )}
        </section>

        {featured.length > 0 ? (
          <section>
            <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Available guides
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  A few guides readers open most often.
                </p>
              </div>
              <Link
                to="/help/browse"
                className="text-sm font-medium text-primary underline underline-offset-4"
              >
                See all areas
              </Link>
            </header>
            <GuideCardList guides={featured} />
          </section>
        ) : null}

        <AskAuraTeaser />
      </div>
    </div>
  );
}
