import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { EmptyState, ErrorState, LoadingRows } from "@/components/studio/DataState";
import { ActionButton } from "@/components/studio/PermissionGate";
import { GuideWorkflowPanel } from "@/components/studio/GuideWorkflowPanel";
import { WorkflowHistory } from "@/components/studio/WorkflowHistory";
import { SourceChip } from "@/components/studio/SourceChip";
import { StatusBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GUIDE_TYPE_LABELS,
  type AssociationKind,
  type GuideAssociation,
  type GuideWithVersion,
} from "@/domain/types";
import { versionIsEditable } from "@/domain/guide-editing";
import { formatDate, formatDateTime } from "@/lib/format";
import { devHarmonyQueries, guideQueries } from "@/lib/queries";

export const Route = createFileRoute("/library/$guideId")({
  head: () => ({
    meta: [
      { title: "Guide Detail — Aurumi Guide Studio" },
      {
        name: "description",
        content:
          "Read-only guide metadata, source associations, applicable feature versions and activity history.",
      },
      { property: "og:title", content: "Guide Detail — Aurumi Guide Studio" },
      {
        property: "og:description",
        content: "Guide metadata and external source associations in Aurumi Guide Studio.",
      },
    ],
  }),
  component: GuideDetailPage,
});

function GuideDetailPage() {
  const { guideId } = Route.useParams();
  const navigate = useNavigate();
  const guide = useQuery(guideQueries.detail(guideId));
  const activity = useQuery(guideQueries.activity(guideId));

  if (guide.isPending) {
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

  const data = guide.data;
  const featureAssocs = data.associations.filter((assoc) => assoc.ref.kind === "feature");
  const relatedGuides = data.associations.filter((assoc) => assoc.ref.kind === "related-guide");

  return (
    <div className="space-y-5">
      <Link
        to="/library"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Guide Library
      </Link>

      <header className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-caps mb-1.5">{GUIDE_TYPE_LABELS[data.guideType]}</p>
            <h1 className="text-2xl font-semibold">{data.title}</h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">/{data.slug}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={data.currentVersion.status} />
            <ActionButton
              action="guide.action.edit"
              icon={<Pencil className="size-3.5" />}
              {...(versionIsEditable(data.currentVersion)
                ? {
                    onClick: () =>
                      void navigate({ to: "/library/edit/$guideId", params: { guideId: data.id } }),
                  }
                : {})}
            />
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm md:grid-cols-5">
          <Meta label="Working version" value={`v${data.currentVersion.versionNumber}`} mono />
          <Meta
            label="Published version"
            value={
              data.publishedVersion ? `v${data.publishedVersion.versionNumber}` : "Not published"
            }
            mono
          />
          <Meta label="Owner" value={data.owner} />
          <Meta label="Last updated" value={formatDate(data.updatedAt)} />
          <Meta
            label="Published"
            value={formatDate(data.publishedVersion?.publishedAt ?? null)}
          />
        </dl>

        {/* Build 2B: review & approval actions for the current GuideVersion. */}
        <div className="mt-4 border-t border-border pt-4">
          <GuideWorkflowPanel guide={data} layout="inline" />
        </div>
      </header>

      <section className="panel p-5">
        <h2 className="label-caps mb-2">Summary</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-foreground/90">{data.summary}</p>
        <p className="mt-4 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Review, approval and publishing run on the working GuideVersion. The published version
          stays live for users until a newer version is published.
        </p>
      </section>

      {/* Read-only content of the working version — what a reviewer reads. */}
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Guide content</h2>
            <p className="text-xs text-muted-foreground">
              Read-only rendering of working version v{data.currentVersion.versionNumber}.
            </p>
          </div>
          <StatusBadge status={data.currentVersion.status} />
        </div>
        <MarkdownPreview
          markdown={data.currentVersion.contentMarkdown}
          emptyState="This version has no content yet."
        />
      </section>


      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="panel" id="associations">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Source associations</h2>
            <p className="text-xs text-muted-foreground">
              Guide Studio references these entities; their source systems remain the owners.
            </p>
          </div>
          <div className="divide-y divide-border">
            <AssocGroup guide={data} kind="app" title="Apps" trail="DevHarmony" />
            <AssocGroup guide={data} kind="feature" title="Features" trail="DevHarmony" />
            <AssocGroup guide={data} kind="topic" title="AI Topics" trail="AI Studio" />
            <AssocGroup guide={data} kind="intent" title="AI Intents" trail="AI Studio" />
            <AssocGroup guide={data} kind="connector" title="Connectors" trail="Connector" />
            <AssocGroup
              guide={data}
              kind="capability"
              title="Connector Capabilities"
              trail="Connector"
            />
          </div>
        </section>

        <div className="space-y-4">
          <section className="panel">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Version information</h2>
            </div>
            <div className="space-y-3 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Guide version</span>
                <span className="font-mono">v{data.currentVersion.versionNumber}</span>
              </div>
              {featureAssocs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No feature associations, so no applicable product versions.
                </p>
              ) : (
                featureAssocs.map((assoc) => (
                  <FeatureVersions
                    key={assoc.id}
                    featureId={assoc.ref.externalId}
                    label={assoc.label}
                  />
                ))
              )}
            </div>
          </section>

          <VersionHistory
            guideId={data.id}
            currentVersionId={data.currentVersionId}
            publishedVersionId={data.publishedVersionId}
          />

          <WorkflowHistory guideId={data.id} />

          <section className="panel">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Related guides</h2>
            </div>
            {relatedGuides.length === 0 ? (
              <EmptyState
                title="No related guides"
                description="Relationships can be curated later."
              />
            ) : (
              <ul className="divide-y divide-border">
                {relatedGuides.map((assoc) => (
                  <li key={assoc.id} className="px-4 py-2.5">
                    <Link
                      to="/library/$guideId"
                      params={{ guideId: assoc.ref.externalId }}
                      className="text-sm font-medium hover:underline"
                    >
                      {assoc.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Activity</h2>
            </div>
            {activity.isPending ? (
              <LoadingRows rows={3} />
            ) : activity.isError ? (
              <ErrorState
                message={(activity.error as Error)?.message}
                onRetry={() => activity.refetch()}
              />
            ) : activity.data!.length === 0 ? (
              <EmptyState title="No recorded activity" />
            ) : (
              <ul className="divide-y divide-border">
                {activity.data!.map((entry) => (
                  <li key={entry.id} className="px-4 py-2.5">
                    <p className="text-sm font-medium">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.actor} · {formatDateTime(entry.at)}
                      {entry.detail ? ` · ${entry.detail}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className={mono ? "mt-0.5 font-mono text-sm" : "mt-0.5 text-sm"}>{value}</dd>
    </div>
  );
}

function AssocGroup({
  guide,
  kind,
  title,
  trail,
}: {
  guide: GuideWithVersion;
  kind: AssociationKind;
  title: string;
  trail: string;
}) {
  const items = guide.associations.filter((assoc) => assoc.ref.kind === kind);
  return (
    <div className="px-4 py-3">
      <p className="label-caps mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No {title.toLowerCase()} associated.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((assoc) => (
            <li key={assoc.id}>
              <AssocChip assoc={assoc} trail={trail} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AssocChip({ assoc, trail }: { assoc: GuideAssociation; trail: string }) {
  const parentLabel = assoc.parentExternalId
    ? assoc.parentExternalId.replace(/^(app|topic|connector)-/, "").replace(/-/g, " ")
    : null;
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
      <SourceChip source={assoc.ref.source} />
      <span className="text-xs text-muted-foreground">
        {trail}
        {parentLabel ? ` → ${titleCase(parentLabel)}` : ""} →
      </span>
      <span className="text-sm font-medium">{assoc.label}</span>
      <span className="font-mono text-[0.625rem] text-muted-foreground">{assoc.ref.externalId}</span>
    </span>
  );
}

/**
 * Guide versions are Guide Studio-owned entities: lifecycle status, version
 * number and publication timestamps live here, not on the guide.
 */
function VersionHistory({
  guideId,
  currentVersionId,
  publishedVersionId,
}: {
  guideId: string;
  currentVersionId: string;
  publishedVersionId: string | null;
}) {
  const versions = useQuery(guideQueries.versions(guideId));
  return (
    <section className="panel">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Version history</h2>
        <p className="text-xs text-muted-foreground">
          Guide Studio-owned lifecycle records — working vs live version
        </p>
      </div>
      {versions.isPending ? (
        <LoadingRows rows={2} />
      ) : versions.isError ? (
        <div className="px-4 py-3">
          <button
            onClick={() => versions.refetch()}
            className="text-xs text-destructive hover:underline"
          >
            Version history failed to load — retry
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {versions.data!.map((version) => (
            <li key={version.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="font-mono text-xs">v{version.versionNumber}</span>
              <StatusBadge status={version.status} />
              <span className="ml-auto text-xs text-muted-foreground">
                {version.id === currentVersionId ? "Working · " : ""}
                {version.id === publishedVersionId ? "Live · " : ""}
                {formatDate(version.publishedAt ?? version.updatedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function FeatureVersions({ featureId, label }: { featureId: string; label: string }) {
  const versions = useQuery(devHarmonyQueries.featureVersions(featureId));
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <p className="text-xs font-medium">{label}</p>
      {versions.isPending ? (
        <Skeleton className="mt-2 h-4 w-32" />
      ) : versions.isError ? (
        <button
          onClick={() => versions.refetch()}
          className="mt-1 text-xs text-destructive hover:underline"
        >
          Version lookup failed — retry
        </button>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {versions.data!.map((version) => (
            <li key={version.externalId} className="flex items-center justify-between text-xs">
              <span className="font-mono">v{version.version}</span>
              <span className="text-muted-foreground">
                {version.status === "current" ? "Current" : "Deprecated"} ·{" "}
                {formatDate(version.releasedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
