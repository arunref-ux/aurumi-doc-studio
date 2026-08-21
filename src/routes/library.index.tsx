import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingRows } from "@/components/studio/DataState";
import { ActionButton } from "@/components/studio/PermissionGate";
import { PageHeader } from "@/components/studio/PageHeader";
import { SourceChip } from "@/components/studio/SourceChip";
import { StatusBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GUIDE_STATUS_LABELS,
  GUIDE_STATUS_ORDER,
  GUIDE_TYPE_LABELS,
  type Guide,
  type GuideQuery,
  type GuideStatus,
  type GuideType,
} from "@/domain/types";
import { formatDate } from "@/lib/format";
import { aiStudioQueries, connectorQueries, devHarmonyQueries, guideQueries } from "@/lib/queries";

export const Route = createFileRoute("/library/")({
  head: () => ({
    meta: [
      { title: "Guide Library — Aurumi Guide Studio" },
      {
        name: "description",
        content:
          "Search and filter every Aurumi Help Guide by status, guide type, related app, AI topic and connector.",
      },
      { property: "og:title", content: "Guide Library — Aurumi Guide Studio" },
      {
        property: "og:description",
        content: "The working area for browsing and filtering Aurumi Help Guides.",
      },
    ],
  }),
  component: LibraryPage,
});

const ALL = "all";

function LibraryPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GuideStatus | typeof ALL>(ALL);
  const [guideType, setGuideType] = useState<GuideType | typeof ALL>(ALL);
  const [appExternalId, setAppExternalId] = useState<string>(ALL);
  const [topicExternalId, setTopicExternalId] = useState<string>(ALL);
  const [connectorExternalId, setConnectorExternalId] = useState<string>(ALL);

  const query: GuideQuery = useMemo(
    () => ({ search, status, guideType, appExternalId, topicExternalId, connectorExternalId }),
    [search, status, guideType, appExternalId, topicExternalId, connectorExternalId],
  );

  const guides = useQuery(guideQueries.list(query));
  const apps = useQuery(devHarmonyQueries.apps());
  const topics = useQuery(aiStudioQueries.topics());
  const connectors = useQuery(connectorQueries.connectors());

  const filtersActive =
    search !== "" ||
    [status, guideType, appExternalId, topicExternalId, connectorExternalId].some(
      (value) => value !== ALL,
    );

  const resetFilters = () => {
    setSearch("");
    setStatus(ALL);
    setGuideType(ALL);
    setAppExternalId(ALL);
    setTopicExternalId(ALL);
    setConnectorExternalId(ALL);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Guide Studio"
        title="Guide Library"
        description="Guides are owned by Guide Studio and reference entities in DevHarmony, Aurumi AI Studio and connector systems."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => guides.refetch()}>
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
            <ActionButton
              action="guide.action.create"
              variant="default"
              icon={<Plus className="size-3.5" />}
            />
          </div>
        }
      />

      <div className="panel p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, summary or guide type"
              className="h-9 pl-8"
            />
          </div>

          <FilterSelect
            value={status}
            onChange={(value) => setStatus(value as GuideStatus | typeof ALL)}
            placeholder="All statuses"
            options={GUIDE_STATUS_ORDER.map((item) => ({
              value: item,
              label: GUIDE_STATUS_LABELS[item],
            }))}
          />
          <FilterSelect
            value={guideType}
            onChange={(value) => setGuideType(value as GuideType | typeof ALL)}
            placeholder="All types"
            options={Object.entries(GUIDE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FilterSelect
            value={appExternalId}
            onChange={setAppExternalId}
            placeholder="All apps"
            options={(apps.data ?? []).map((app) => ({ value: app.externalId, label: app.name }))}
          />
          <FilterSelect
            value={topicExternalId}
            onChange={setTopicExternalId}
            placeholder="All AI topics"
            options={(topics.data ?? []).map((topic) => ({
              value: topic.externalId,
              label: topic.name,
            }))}
          />
          <FilterSelect
            value={connectorExternalId}
            onChange={setConnectorExternalId}
            placeholder="All connectors"
            options={(connectors.data ?? []).map((connector) => ({
              value: connector.externalId,
              label: connector.name,
            }))}
          />

          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="size-3.5" /> Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-semibold">Guides</h2>
          <span className="text-xs text-muted-foreground">
            {guides.isPending ? "Loading…" : `${guides.data?.length ?? 0} result(s)`}
          </span>
        </div>

        {guides.isError ? (
          <ErrorState message={(guides.error as Error)?.message} onRetry={() => guides.refetch()} />
        ) : guides.isPending ? (
          <LoadingRows rows={8} />
        ) : guides.data!.length === 0 ? (
          <EmptyState
            title="No guides match these filters"
            description="Try clearing a filter or searching for a different term."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <Th className="w-[30%]">Guide</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Version</Th>
                  <Th className="w-[22%]">Primary context</Th>
                  <Th>Owner</Th>
                  <Th>Updated</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {guides.data!.map((guide) => (
                  <tr key={guide.id} className="transition-colors hover:bg-accent/50">
                    <td className="px-4 py-2.5">
                      <Link
                        to="/library/$guideId"
                        params={{ guideId: guide.id }}
                        className="block font-medium text-foreground hover:underline"
                      >
                        {guide.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {guide.summary}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {GUIDE_TYPE_LABELS[guide.guideType]}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={guide.currentVersion.status} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs tabular-nums">
                      v{guide.currentVersion.versionNumber}
                    </td>
                    <td className="px-4 py-2.5">
                      <PrimaryContext guide={guide} />
                    </td>
                    <td className="px-4 py-2.5 text-xs">{guide.owner}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {formatDate(guide.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryContext({ guide }: { guide: GuideWithVersion }) {
  const primary =
    guide.associations.find((assoc) => assoc.ref.kind === "feature") ??
    guide.associations.find((assoc) => assoc.ref.kind === "capability") ??
    guide.associations.find((assoc) => assoc.ref.kind === "app") ??
    guide.associations.find((assoc) => assoc.ref.kind === "connector") ??
    guide.associations.find((assoc) => assoc.ref.kind === "topic");

  if (!primary) {
    return <span className="text-xs text-muted-foreground">Product-wide</span>;
  }
  return <SourceChip source={primary.ref.source}>{primary.label}</SourceChip>;
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`label-caps px-4 py-2 font-semibold ${className ?? ""}`}>{children}</th>;
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-36 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
