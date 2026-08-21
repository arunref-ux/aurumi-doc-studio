import { queryOptions } from "@tanstack/react-query";
import type { GuideQuery } from "@/domain/types";
import { providers } from "@/providers";
import { createCoverageService } from "@/services/coverage.service";

/** Composition boundary: coverage joins external providers + Guide Studio. */
const coverageService = createCoverageService(providers);

const retry = 1;

export const devHarmonyQueries = {
  apps: () => queryOptions({ queryKey: ["devharmony", "apps"], queryFn: () => providers.devHarmony.getApps(), retry }),
  features: (appId: string | null) =>
    queryOptions({
      queryKey: ["devharmony", "features", appId],
      queryFn: () => providers.devHarmony.getFeaturesByApp(appId!),
      enabled: Boolean(appId),
      retry,
    }),
  featureVersions: (featureId: string | null) =>
    queryOptions({
      queryKey: ["devharmony", "feature-versions", featureId],
      queryFn: () => providers.devHarmony.getFeatureVersions(featureId!),
      enabled: Boolean(featureId),
      retry,
    }),
};

export const aiStudioQueries = {
  topics: () =>
    queryOptions({ queryKey: ["ai-studio", "topics"], queryFn: () => providers.aiStudio.getTopics(), retry }),
  intents: (topicId: string | null) =>
    queryOptions({
      queryKey: ["ai-studio", "intents", topicId],
      queryFn: () => providers.aiStudio.getIntentsByTopic(topicId!),
      enabled: Boolean(topicId),
      retry,
    }),
};

export const connectorQueries = {
  connectors: () =>
    queryOptions({
      queryKey: ["connectors", "list"],
      queryFn: () => providers.connectors.getConnectors(),
      retry,
    }),
  capabilities: (connectorId: string | null) =>
    queryOptions({
      queryKey: ["connectors", "capabilities", connectorId],
      queryFn: () => providers.connectors.getCapabilitiesByConnector(connectorId!),
      enabled: Boolean(connectorId),
      retry,
    }),
};

export const guideQueries = {
  list: (query: GuideQuery = {}) =>
    queryOptions({
      queryKey: ["guides", "list", query],
      queryFn: () => providers.guideStudio.listGuides(query),
      retry,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ["guides", "detail", id],
      queryFn: () => providers.guideStudio.getGuide(id),
      retry,
    }),
  activity: (guideId: string) =>
    queryOptions({
      queryKey: ["guides", "activity", guideId],
      queryFn: () => providers.guideStudio.getGuideActivity(guideId),
      retry,
    }),
  statusCounts: () =>
    queryOptions({
      queryKey: ["guides", "status-counts"],
      queryFn: () => providers.guideStudio.getStatusCounts(),
      retry,
    }),
  recentActivity: (limit = 8) =>
    queryOptions({
      queryKey: ["guides", "recent-activity", limit],
      queryFn: () => providers.guideStudio.getRecentActivity(limit),
      retry,
    }),
  versions: (guideId: string) =>
    queryOptions({
      queryKey: ["guides", "versions", guideId],
      queryFn: () => providers.guideStudio.getGuideVersions(guideId),
      retry,
    }),
};

/** Coverage fans out across every provider, so it tolerates more retries. */
const composedRetry = 3;

export const coverageQueries = {
  summary: () =>
    queryOptions({
      queryKey: ["coverage", "summary"],
      queryFn: () => coverageService.getCoverageSummary(),
      retry: composedRetry,
    }),
  stateIndex: () =>
    queryOptions({
      queryKey: ["coverage", "state-index"],
      queryFn: () => coverageService.getCoverageStateIndex(),
      retry: composedRetry,
    }),
};
