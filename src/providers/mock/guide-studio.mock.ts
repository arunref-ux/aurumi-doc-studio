import { seedActivity, seedGuideVersions, seedGuides } from "@/data/seed/guides";
import {
  assertAssociationValid,
  validateGuideAssociations,
  validateGuideVersions,
} from "@/domain/association-rules";
import { refKey } from "@/domain/external-ref";
import {
  guideProvidesAuthoringCoverage,
  guideProvidesPublishedCoverage,
} from "@/domain/guide-lifecycle";
import {
  GUIDE_STATUS_ORDER,
  GUIDE_TYPE_LABELS,
  type CoverageFact,
  type Guide,
  type GuideAssociation,
  type GuideQuery,
  type GuideVersion,
  type GuideVersionStatus,
  type GuideWithVersion,
} from "@/domain/types";
import type { CreateAssociationInput, GuideStudioProvider } from "@/providers/interfaces";
import { clone, simulateRequest } from "./latency";

/**
 * Guide Studio-owned mock store. It knows NOTHING about the external mock
 * persistence structure — no DevHarmony / AI Studio / Connector seed imports.
 */
const guides: Guide[] = seedGuides.map((guide) => ({ ...guide }));
const versions: GuideVersion[] = seedGuideVersions.map((version) => ({ ...version }));

/**
 * Store initialization integrity gate. Seed, imported and future hydrated data
 * pass through exactly the same rules as runtime writes, so invalid source/kind
 * combinations or duplicate composite associations fail early and loudly.
 */
validateGuideAssociations(guides);
validateGuideVersions(guides, versions);

function versionsOf(guideId: string): GuideVersion[] {
  return versions.filter((version) => version.guideId === guideId);
}

function currentVersion(guide: Guide): GuideVersion {
  const version = versions.find((item) => item.id === guide.currentVersionId);
  if (!version) {
    throw new Error(`Guide ${guide.id} has no current GuideVersion record.`);
  }
  return version;
}

function withVersion(guide: Guide): GuideWithVersion {
  return { ...guide, currentVersion: currentVersion(guide), versions: versionsOf(guide.id) };
}

function matches(guide: GuideWithVersion, query: GuideQuery): boolean {
  const term = query.search?.trim().toLowerCase();
  if (term) {
    const haystack = [guide.title, guide.summary, GUIDE_TYPE_LABELS[guide.guideType], guide.owner]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(term)) return false;
  }
  if (query.status && query.status !== "all" && guide.currentVersion.status !== query.status) {
    return false;
  }
  if (query.guideType && query.guideType !== "all" && guide.guideType !== query.guideType) {
    return false;
  }

  const hasRef = (source: string, kind: string, externalId: string) =>
    guide.associations.some(
      (association) => refKey(association.ref) === refKey({ source, kind, externalId }),
    );

  if (
    query.appExternalId &&
    query.appExternalId !== "all" &&
    !hasRef("devharmony", "app", query.appExternalId)
  ) {
    return false;
  }
  if (
    query.topicExternalId &&
    query.topicExternalId !== "all" &&
    !hasRef("ai-studio", "topic", query.topicExternalId)
  ) {
    return false;
  }
  if (
    query.connectorExternalId &&
    query.connectorExternalId !== "all" &&
    !hasRef("connector", "connector", query.connectorExternalId)
  ) {
    return false;
  }

  return true;
}

/**
 * Coverage facts: composite-key indexed, derived from ALL GuideVersions of each
 * associated guide (never only `currentVersionId`). Lifecycle rules come from
 * the centralized helpers in `@/domain/guide-lifecycle`.
 */
function coverageFacts(): CoverageFact[] {
  const index = new Map<string, CoverageFact>();

  for (const guide of guides) {
    const guideVersions = versionsOf(guide.id);
    const authoring = guideProvidesAuthoringCoverage(guideVersions);
    const published = guideProvidesPublishedCoverage(guideVersions);
    if (!authoring && !published) continue;

    for (const association of guide.associations) {
      const key = refKey(association.ref);
      const existing = index.get(key);
      if (existing) {
        existing.authoringCoverage = existing.authoringCoverage || authoring;
        existing.publishedCoverage = existing.publishedCoverage || published;
        existing.guideCount += 1;
      } else {
        index.set(key, {
          ref: association.ref,
          authoringCoverage: authoring,
          publishedCoverage: published,
          guideCount: 1,
        });
      }
    }
  }

  return Array.from(index.values());
}

export const mockGuideStudioProvider: GuideStudioProvider = {
  listGuides: (query = {}) =>
    simulateRequest(
      () =>
        clone(
          guides
            .map(withVersion)
            .filter((guide) => matches(guide, query))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        ),
      { label: "Guide Studio Guides API", failureRate: 0.03 },
    ),

  getGuide: (idOrSlug) =>
    simulateRequest(
      () => {
        const guide = guides.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
        return guide ? clone(withVersion(guide)) : null;
      },
      { label: "Guide Studio Guide API" },
    ),

  getGuideVersions: (guideId) =>
    simulateRequest(() => clone(versionsOf(guideId)), { label: "Guide Studio Versions API" }),

  getGuideActivity: (guideId) =>
    simulateRequest(
      () =>
        clone(
          seedActivity
            .filter((entry) => entry.guideId === guideId)
            .sort((a, b) => b.at.localeCompare(a.at)),
        ),
      { label: "Guide Studio Activity API", minLatency: 140, maxLatency: 360 },
    ),

  getStatusCounts: () =>
    simulateRequest(
      () => {
        const byStatus = GUIDE_STATUS_ORDER.reduce(
          (acc, status) => {
            acc[status] = guides.filter((guide) => currentVersion(guide).status === status).length;
            return acc;
          },
          {} as Record<GuideVersionStatus, number>,
        );
        return { total: guides.length, byStatus };
      },
      { label: "Guide Studio Metrics API" },
    ),

  getRecentActivity: (limit = 8) =>
    simulateRequest(
      () => clone([...seedActivity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)),
      { label: "Guide Studio Activity API" },
    ),

  getCoverageFacts: () =>
    simulateRequest(() => clone(coverageFacts()), { label: "Guide Coverage Index API" }),

  createAssociation: (input: CreateAssociationInput) =>
    simulateRequest(
      () => {
        const guide = guides.find((item) => item.id === input.guideId);
        if (!guide) throw new Error(`Unknown guide: ${input.guideId}`);

        // Shared domain rules: valid source/kind combination and composite
        // uniqueness of guideId + source + kind + externalId. Identical to the
        // initialization gate above.
        assertAssociationValid({ guideId: guide.id, ref: input.ref }, guide.associations);

        const association: GuideAssociation = {
          id: `${guide.id}-assoc-${guide.associations.length + 1}`,
          guideId: guide.id,
          ref: input.ref,
          label: input.label,
          ...(input.parentExternalId ? { parentExternalId: input.parentExternalId } : {}),
        };
        guide.associations = [...guide.associations, association];
        return clone(association);
      },
      { label: "Guide Studio Association API" },
    ),
};
