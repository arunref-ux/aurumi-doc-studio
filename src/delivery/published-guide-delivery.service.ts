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

  return {
    listPublishedGuides,
    getPublishedGuide,
    getPublishedGuidesByAssociation,
    getPublishedGuidesByRefKey,
    listPublishedAssociationTargets,
  };
}
