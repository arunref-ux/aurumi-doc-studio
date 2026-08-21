import { aiIntents } from "@/data/seed/ai-studio";
import { connectorCapabilities } from "@/data/seed/connectors";
import { devHarmonyFeatures } from "@/data/seed/devharmony";
import { seedActivity, seedGuides } from "@/data/seed/guides";
import {
  GUIDE_STATUS_ORDER,
  GUIDE_TYPE_LABELS,
  type CoverageBucket,
  type Guide,
  type GuideQuery,
  type GuideStatus,
} from "@/domain/types";
import type { GuideStudioProvider } from "@/providers/interfaces";
import { clone, simulateRequest } from "./latency";

function coveredIds(): Set<string> {
  const set = new Set<string>();
  for (const guide of seedGuides) {
    if (guide.status === "archived") continue;
    for (const association of guide.associations) set.add(association.externalId);
  }
  return set;
}

function bucket(
  label: string,
  entities: { externalId: string; name: string }[],
  covered: Set<string>,
): CoverageBucket {
  const uncovered = entities.filter((entity) => !covered.has(entity.externalId));
  return {
    label,
    total: entities.length,
    covered: entities.length - uncovered.length,
    uncovered: uncovered.length,
    uncoveredExamples: uncovered.map((entity) => entity.name),
  };
}

function matches(guide: Guide, query: GuideQuery): boolean {
  const term = query.search?.trim().toLowerCase();
  if (term) {
    const haystack = [
      guide.title,
      guide.summary,
      GUIDE_TYPE_LABELS[guide.guideType],
      guide.owner,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(term)) return false;
  }
  if (query.status && query.status !== "all" && guide.status !== query.status) return false;
  if (query.guideType && query.guideType !== "all" && guide.guideType !== query.guideType) return false;

  const hasAssoc = (kind: string, externalId: string) =>
    guide.associations.some(
      (association) => association.kind === kind && association.externalId === externalId,
    );

  if (query.appExternalId && query.appExternalId !== "all" && !hasAssoc("app", query.appExternalId))
    return false;
  if (query.topicExternalId && query.topicExternalId !== "all" && !hasAssoc("topic", query.topicExternalId))
    return false;
  if (
    query.connectorExternalId &&
    query.connectorExternalId !== "all" &&
    !hasAssoc("connector", query.connectorExternalId)
  )
    return false;

  return true;
}

export const mockGuideStudioProvider: GuideStudioProvider = {
  listGuides: (query = {}) =>
    simulateRequest(
      () =>
        clone(
          seedGuides
            .filter((guide) => matches(guide, query))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        ),
      { label: "Guide Studio Guides API", failureRate: 0.03 },
    ),

  getGuide: (idOrSlug) =>
    simulateRequest(
      () => {
        const guide = seedGuides.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
        return guide ? clone(guide) : null;
      },
      { label: "Guide Studio Guide API" },
    ),

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
            acc[status] = seedGuides.filter((guide) => guide.status === status).length;
            return acc;
          },
          {} as Record<GuideStatus, number>,
        );
        return { total: seedGuides.length, byStatus };
      },
      { label: "Guide Studio Metrics API" },
    ),

  getRecentActivity: (limit = 8) =>
    simulateRequest(
      () => clone([...seedActivity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)),
      { label: "Guide Studio Activity API" },
    ),

  getCoverageSummary: () =>
    simulateRequest(
      () => {
        const covered = coveredIds();
        return {
          features: bucket("DevHarmony Features", devHarmonyFeatures, covered),
          intents: bucket("AI Studio Intents", aiIntents, covered),
          capabilities: bucket("Connector Capabilities", connectorCapabilities, covered),
        };
      },
      { label: "Documentation Coverage API", failureRate: 0.03 },
    ),

  getCoveredExternalIds: () =>
    simulateRequest(() => Array.from(coveredIds()), { label: "Guide Coverage Index API" }),
};
