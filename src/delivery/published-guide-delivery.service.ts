import {
  REFERENCE_KIND_LABELS,
  isValidSourceKind,
  refKey,
  type ReferenceKind,
} from "@/domain/external-ref";
import {
  comparePublishedGuides,
  resolvePublishedGuide,
  type PublishedGuide,
} from "@/domain/published-guide";
import type { ProviderRegistry } from "@/providers/interfaces";
import type {
  PublishedAssociationTarget,
  PublishedBrowseArea,
  PublishedBrowseContext,
  PublishedGuideDeliveryProvider,
  PublishedGuideRefQuery,
  PublishedGuideSearchHit,
} from "./interfaces";

/**
 * Build 3B — consumer browse taxonomy. Parent kinds group child kinds, and each
 * area carries the friendly wording consumers see. Internal source / kind /
 * externalId vocabulary never crosses this boundary.
 */
const BROWSE_AREAS: Array<{
  areaId: string;
  source: string;
  label: string;
  description: string;
  parentKind: ReferenceKind;
  childKind: ReferenceKind;
}> = [
  {
    areaId: "apps",
    source: "devharmony",
    label: "Apps & features",
    description: "Step-by-step help for the apps and features you work in every day.",
    parentKind: "app",
    childKind: "feature",
  },
  {
    areaId: "topics",
    source: "ai-studio",
    label: "Topics & tasks",
    description: "Guides organised around what you are trying to get done.",
    parentKind: "topic",
    childKind: "intent",
  },
  {
    areaId: "integrations",
    source: "connector",
    label: "Integrations",
    description: "Connect Aurumi to the tools your business already uses.",
    parentKind: "connector",
    childKind: "capability",
  },
];

/**
 * Build 3A — mock Published Guide Delivery implementation.
 *
 * It COMPOSES the existing Guide Studio read provider (the same discipline used
 * for coverage) and owns:
 *  - published-content resolution through `Guide.publishedVersionId`
 *  - fail-closed integrity validation
 *  - consumer-facing projection
 *  - association-based published retrieval
 *
 * It imports no seed arrays and no provider internals, so it can be replaced by
 * an HTTP / cached / search-backed implementation without touching consumers.
 */
export function createPublishedGuideDeliveryService(
  providers: ProviderRegistry,
): PublishedGuideDeliveryProvider {
  async function listPublishedGuides(): Promise<PublishedGuide[]> {
    const guides = await providers.guideStudio.listGuides();
    return guides
      .map((guide) => resolvePublishedGuide(guide))
      .filter((guide): guide is PublishedGuide => guide !== null)
      .sort(comparePublishedGuides);
  }

  async function getPublishedGuide(guideId: string): Promise<PublishedGuide | null> {
    if (!guideId.trim()) return null;
    const guide = await providers.guideStudio.getGuide(guideId);
    return resolvePublishedGuide(guide);
  }

  async function getPublishedGuidesByRefKey(key: string): Promise<PublishedGuide[]> {
    if (!key.trim()) return [];
    const published = await listPublishedGuides();
    return published.filter((guide) => guide.refKeys.includes(key));
  }

  async function getPublishedGuidesByAssociation(
    query: PublishedGuideRefQuery,
  ): Promise<PublishedGuide[]> {
    // Source/kind compatibility stays enforced; bare externalId never matches.
    if (!isValidSourceKind(query.source, query.kind)) return [];
    if (!query.externalId.trim()) return [];
    return getPublishedGuidesByRefKey(refKey(query));
  }

  async function listPublishedAssociationTargets(): Promise<PublishedAssociationTarget[]> {
    const published = await listPublishedGuides();
    const targets = new Map<string, PublishedAssociationTarget>();

    for (const guide of published) {
      for (const association of guide.associations) {
        const key = refKey(association.ref);
        const existing = targets.get(key);
        if (existing) {
          existing.publishedGuideCount += 1;
          continue;
        }
        targets.set(key, {
          ref: association.ref,
          refKey: key,
          label: association.label,
          ...(association.parentExternalId
            ? { parentExternalId: association.parentExternalId }
            : {}),
          publishedGuideCount: 1,
        });
      }
    }

    return [...targets.values()].sort(
      (a, b) => a.ref.kind.localeCompare(b.ref.kind) || a.label.localeCompare(b.label),
    );
  }

  /**
   * Build 3B — browse tree. Derived exclusively from published associations, so
   * a context can never exist for content that is not currently live. Children
   * whose parent has no published Help are promoted to the area root, keeping
   * every published guide reachable by browsing.
   */
  async function listPublishedBrowseAreas(): Promise<PublishedBrowseArea[]> {
    const targets = await listPublishedAssociationTargets();

    return BROWSE_AREAS.map((area) => {
      const inArea = targets.filter((target) => target.ref.source === area.source);
      const parents = inArea.filter((target) => target.ref.kind === area.parentKind);
      const children = inArea.filter((target) => target.ref.kind === area.childKind);
      const parentByExternalId = new Map(
        parents.map((parent) => [parent.ref.externalId, parent] as const),
      );

      const childrenByParent = new Map<string, PublishedAssociationTarget[]>();
      const orphans: PublishedAssociationTarget[] = [];
      for (const child of children) {
        const parentId = child.parentExternalId;
        if (parentId && parentByExternalId.has(parentId)) {
          const bucket = childrenByParent.get(parentId) ?? [];
          bucket.push(child);
          childrenByParent.set(parentId, bucket);
        } else {
          orphans.push(child);
        }
      }

      const contexts: PublishedBrowseContext[] = [
        ...parents.map((parent) =>
          toContext(parent, (childrenByParent.get(parent.ref.externalId) ?? []).map(toLeaf)),
        ),
        ...orphans.map(toLeaf),
      ].sort((a, b) => a.label.localeCompare(b.label));

      return {
        areaId: area.areaId,
        label: area.label,
        description: area.description,
        totalPublishedGuideCount: contexts.reduce(
          (total, context) => total + context.totalPublishedGuideCount,
          0,
        ),
        contexts,
      };
    }).filter((area) => area.contexts.length > 0);
  }

  async function getPublishedBrowseContext(key: string): Promise<PublishedBrowseContext | null> {
    if (!key.trim()) return null;
    const areas = await listPublishedBrowseAreas();
    for (const area of areas) {
      for (const context of area.contexts) {
        if (context.refKey === key) return context;
        const child = context.children.find((item) => item.refKey === key);
        if (child) return child;
      }
    }
    return null;
  }

  /**
   * Deterministic, case-insensitive substring search. No AI, no embeddings, no
   * relevance scoring: it searches the published projection only, so drafts,
   * in-review, approved-but-unpublished and archived content cannot match.
   */
  async function searchPublishedGuides(query: string): Promise<PublishedGuideSearchHit[]> {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const published = await listPublishedGuides();

    const hits: PublishedGuideSearchHit[] = [];
    for (const guide of published) {
      const matchedIn: PublishedGuideSearchHit["matchedIn"] = [];
      if (guide.title.toLowerCase().includes(needle)) matchedIn.push("title");
      if (guide.summary.toLowerCase().includes(needle)) matchedIn.push("summary");
      if (guide.contentMarkdown.toLowerCase().includes(needle)) matchedIn.push("content");
      if (matchedIn.length > 0) hits.push({ guide, matchedIn });
    }

    // Deterministic ordering: title matches first, then alphabetical.
    return hits.sort((a, b) => {
      const aTitle = a.matchedIn.includes("title") ? 0 : 1;
      const bTitle = b.matchedIn.includes("title") ? 0 : 1;
      return aTitle - bTitle || comparePublishedGuides(a.guide, b.guide);
    });
  }

  /** Deterministic relatedness: at least one shared published association. */
  async function getRelatedPublishedGuides(guideId: string): Promise<PublishedGuide[]> {
    const subject = await getPublishedGuide(guideId);
    if (!subject) return [];
    const keys = new Set(subject.refKeys);
    const published = await listPublishedGuides();
    return published.filter(
      (guide) => guide.guideId !== subject.guideId && guide.refKeys.some((key) => keys.has(key)),
    );
  }

  return {
    listPublishedGuides,
    getPublishedGuide,
    getPublishedGuidesByAssociation,
    getPublishedGuidesByRefKey,
    listPublishedAssociationTargets,
    listPublishedBrowseAreas,
    getPublishedBrowseContext,
    searchPublishedGuides,
    getRelatedPublishedGuides,
  };
}
