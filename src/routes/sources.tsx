import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Database, RefreshCw } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingRows } from "@/components/studio/DataState";
import { PageHeader } from "@/components/studio/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { refKey, type ExternalEntityReference } from "@/domain/external-ref";
import { type CoverageState } from "@/domain/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import {
  aiStudioQueries,
  connectorQueries,
  coverageQueries,
  devHarmonyQueries,
} from "@/lib/queries";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Sources — Aurumi Guide Studio" },
      {
        name: "description",
        content:
          "Browse DevHarmony apps, features and versions, Aurumi AI Studio topics and intents, and connector capabilities consumed by Guide Studio.",
      },
      { property: "og:title", content: "Sources — Aurumi Guide Studio" },
      {
        property: "og:description",
        content: "External knowledge sources that Guide Studio consumes but does not own.",
      },
    ],
  }),
  component: SourcesPage,
});

function SourcesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="External systems"
        title="Sources"
        description="Guide Studio consumes these hierarchies through provider APIs. It never owns apps, features, intents or capabilities — child levels load on demand."
      />

      <Tabs defaultValue="devharmony">
        <TabsList>
          <TabsTrigger value="devharmony">DevHarmony</TabsTrigger>
          <TabsTrigger value="ai-studio">Aurumi AI Studio</TabsTrigger>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
        </TabsList>
        <TabsContent value="devharmony" className="mt-4">
          <DevHarmonyExplorer />
        </TabsContent>
        <TabsContent value="ai-studio" className="mt-4">
          <AIStudioExplorer />
        </TabsContent>
        <TabsContent value="connectors" className="mt-4">
          <ConnectorExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Coverage state is resolved through the composition service using composite
 * identity (source + kind + externalId), never bare external ids.
 */
function useCoverage() {
  const index = useQuery(coverageQueries.stateIndex());
  return (ref: ExternalEntityReference): CoverageState =>
    index.data?.[refKey(ref)] ?? "not-started";
}

const COVERAGE_TAG: Record<CoverageState, { label: string; className: string }> = {
  published: {
    label: "Published",
    className: "bg-status-published text-status-published-foreground",
  },
  "in-progress": {
    label: "Authoring",
    className: "bg-status-review text-status-review-foreground",
  },
  "not-started": { label: "No guide", className: "bg-muted text-muted-foreground" },
};

function CoverageTag({ state }: { state: CoverageState }) {
  const tag = COVERAGE_TAG[state];
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium", tag.className)}>
      {tag.label}
    </span>
  );
}

function Panel({
  title,
  subtitle,
  children,
  onRefresh,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onRefresh?: (() => void) | undefined;
}) {
  return (
    <section className="panel flex min-h-72 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {onRefresh ? (
          <Button variant="ghost" size="icon" className="size-7" onClick={onRefresh}>
            <RefreshCw className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}

function ListRow({
  active,
  onClick,
  primary,
  secondary,
  trailing,
}: {
  active?: boolean;
  onClick?: () => void;
  primary: string;
  secondary?: string;
  trailing?: React.ReactNode;
}) {
  const Element = onClick ? "button" : "div";
  return (
    <Element
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 border-b border-border px-4 py-2.5 text-left transition-colors",
        onClick ? "hover:bg-accent/60" : "",
        active ? "bg-accent" : "",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{primary}</p>
        {secondary ? <p className="truncate text-xs text-muted-foreground">{secondary}</p> : null}
      </div>
      {trailing}
      {onClick ? <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" /> : null}
    </Element>
  );
}

function DevHarmonyExplorer() {
  const [appId, setAppId] = useState<string | null>(null);
  const [featureId, setFeatureId] = useState<string | null>(null);
  const apps = useQuery(devHarmonyQueries.apps());
  const features = useQuery(devHarmonyQueries.features(appId));
  const versions = useQuery(devHarmonyQueries.featureVersions(featureId));
  const isCovered = useCoverage();

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Panel title="Apps" subtitle="DevHarmony · getApps()" onRefresh={() => apps.refetch()}>
        {apps.isPending ? (
          <LoadingRows rows={3} />
        ) : apps.isError ? (
          <ErrorState message={(apps.error as Error)?.message} onRetry={() => apps.refetch()} />
        ) : (
          apps.data!.map((app) => (
            <ListRow
              key={app.externalId}
              active={appId === app.externalId}
              onClick={() => {
                setAppId(app.externalId);
                setFeatureId(null);
              }}
              primary={app.name}
              secondary={`${app.featureCount} features · ${app.externalId}`}
              trailing={<CoverageTag state={isCovered({ source: "devharmony", kind: "app", externalId: app.externalId })} />}
            />
          ))
        )}
      </Panel>

      <Panel
        title="Features"
        subtitle="DevHarmony · getFeaturesByApp(appId)"
        onRefresh={appId ? () => features.refetch() : undefined}
      >
        {!appId ? (
          <EmptyState title="Select an app" description="Features load lazily per app." />
        ) : features.isPending ? (
          <LoadingRows rows={5} />
        ) : features.isError ? (
          <ErrorState message={(features.error as Error)?.message} onRetry={() => features.refetch()} />
        ) : features.data!.length === 0 ? (
          <EmptyState title="No features returned" />
        ) : (
          features.data!.map((feature) => (
            <ListRow
              key={feature.externalId}
              active={featureId === feature.externalId}
              onClick={() => setFeatureId(feature.externalId)}
              primary={feature.name}
              secondary={`Latest v${feature.latestVersion} · ${feature.externalId}`}
              trailing={<CoverageTag state={isCovered({ source: "devharmony", kind: "feature", externalId: feature.externalId })} />}
            />
          ))
        )}
      </Panel>

      <Panel
        title="Feature versions"
        subtitle="DevHarmony · getFeatureVersions(featureId)"
        onRefresh={featureId ? () => versions.refetch() : undefined}
      >
        {!featureId ? (
          <EmptyState title="Select a feature" description="Versions load on demand." />
        ) : versions.isPending ? (
          <LoadingRows rows={2} />
        ) : versions.isError ? (
          <ErrorState message={(versions.error as Error)?.message} onRetry={() => versions.refetch()} />
        ) : (
          versions.data!.map((version) => (
            <ListRow
              key={version.externalId}
              primary={`Version ${version.version}`}
              secondary={`Released ${formatDate(version.releasedAt)}`}
              trailing={
                <span className="text-xs text-muted-foreground">
                  {version.status === "current" ? "Current" : "Deprecated"}
                </span>
              }
            />
          ))
        )}
      </Panel>
    </div>
  );
}

function AIStudioExplorer() {
  const [topicId, setTopicId] = useState<string | null>(null);
  const topics = useQuery(aiStudioQueries.topics());
  const intents = useQuery(aiStudioQueries.intents(topicId));
  const isCovered = useCoverage();

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.6fr]">
      <Panel title="Topics" subtitle="AI Studio · getTopics()" onRefresh={() => topics.refetch()}>
        {topics.isPending ? (
          <LoadingRows rows={3} />
        ) : topics.isError ? (
          <ErrorState message={(topics.error as Error)?.message} onRetry={() => topics.refetch()} />
        ) : (
          topics.data!.map((topic) => (
            <ListRow
              key={topic.externalId}
              active={topicId === topic.externalId}
              onClick={() => setTopicId(topic.externalId)}
              primary={topic.name}
              secondary={`${topic.intentCount} intents · ${topic.description}`}
              trailing={<CoverageTag state={isCovered({ source: "ai-studio", kind: "topic", externalId: topic.externalId })} />}
            />
          ))
        )}
      </Panel>

      <Panel
        title="Intents"
        subtitle="AI Studio · getIntentsByTopic(topicId) · utterances are not editable here"
        onRefresh={topicId ? () => intents.refetch() : undefined}
      >
        {!topicId ? (
          <EmptyState
            title="Select a topic"
            description="Intents are never loaded in bulk at startup."
          />
        ) : intents.isPending ? (
          <LoadingRows rows={5} />
        ) : intents.isError ? (
          <ErrorState message={(intents.error as Error)?.message} onRetry={() => intents.refetch()} />
        ) : (
          intents.data!.map((intent) => (
            <ListRow
              key={intent.externalId}
              primary={intent.name}
              secondary={`${intent.description} · ${intent.utteranceCount} utterances`}
              trailing={<CoverageTag state={isCovered({ source: "ai-studio", kind: "intent", externalId: intent.externalId })} />}
            />
          ))
        )}
      </Panel>
    </div>
  );
}

function ConnectorExplorer() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const connectors = useQuery(connectorQueries.connectors());
  const capabilities = useQuery(connectorQueries.capabilities(connectorId));
  const isCovered = useCoverage();

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.6fr]">
      <Panel
        title="Connectors"
        subtitle="Connector registry · getConnectors()"
        onRefresh={() => connectors.refetch()}
      >
        {connectors.isPending ? (
          <LoadingRows rows={2} />
        ) : connectors.isError ? (
          <ErrorState
            message={(connectors.error as Error)?.message}
            onRetry={() => connectors.refetch()}
          />
        ) : (
          connectors.data!.map((connector) => (
            <ListRow
              key={connector.externalId}
              active={connectorId === connector.externalId}
              onClick={() => setConnectorId(connector.externalId)}
              primary={connector.name}
              secondary={`${connector.vendor} · ${connector.category} · ${connector.capabilityCount} capabilities`}
              trailing={<CoverageTag state={isCovered({ source: "connector", kind: "connector", externalId: connector.externalId })} />}
            />
          ))
        )}
      </Panel>

      <Panel
        title="Capabilities"
        subtitle="Connector registry · getCapabilitiesByConnector(connectorId)"
        onRefresh={connectorId ? () => capabilities.refetch() : undefined}
      >
        {!connectorId ? (
          <EmptyState title="Select a connector" description="Capabilities load lazily." />
        ) : capabilities.isPending ? (
          <LoadingRows rows={4} />
        ) : capabilities.isError ? (
          <ErrorState
            message={(capabilities.error as Error)?.message}
            onRetry={() => capabilities.refetch()}
          />
        ) : (
          capabilities.data!.map((capability) => (
            <ListRow
              key={capability.externalId}
              primary={capability.name}
              secondary={capability.description}
              trailing={<CoverageTag state={isCovered({ source: "connector", kind: "capability", externalId: capability.externalId })} />}
            />
          ))
        )}
      </Panel>
    </div>
  );
}

export function SourcesFooterNote() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Database className="size-3.5" /> Source data is simulated for Build 1.
    </p>
  );
}
