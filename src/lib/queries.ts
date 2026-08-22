import { queryOptions } from "@tanstack/react-query";
import { publishedGuideDelivery } from "@/delivery";
import type { PublishedGuideRefQuery } from "@/delivery/interfaces";
import type { GuideQuery } from "@/domain/types";
import { helpRetrieval } from "@/help-retrieval";
import type { AuraHelpRequest } from "@/help-retrieval/interfaces";
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
  workflowEvents: (guideId: string) =>
    queryOptions({
      queryKey: ["guides", "workflow-events", guideId],
      queryFn: () => providers.guideStudio.getWorkflowEvents(guideId),
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

/**
 * Build 3A — Published Guide Delivery access. The internal demonstration
 * surface uses exactly the contract future Help consumers will use; published
 * resolution never happens in components.
 */
export const publishedDeliveryQueries = {
  list: () =>
    queryOptions({
      queryKey: ["published-delivery", "list"],
      queryFn: () => publishedGuideDelivery.listPublishedGuides(),
      retry,
    }),
  detail: (guideId: string | null) =>
    queryOptions({
      queryKey: ["published-delivery", "detail", guideId],
      queryFn: () => publishedGuideDelivery.getPublishedGuide(guideId!),
      enabled: Boolean(guideId),
      retry,
    }),
  associationTargets: () =>
    queryOptions({
      queryKey: ["published-delivery", "association-targets"],
      queryFn: () => publishedGuideDelivery.listPublishedAssociationTargets(),
      retry,
    }),
  byAssociation: (query: PublishedGuideRefQuery | null) =>
    queryOptions({
      queryKey: ["published-delivery", "by-association", query],
      queryFn: () => publishedGuideDelivery.getPublishedGuidesByAssociation(query!),
      enabled: Boolean(query),
      retry,
    }),
  byRefKey: (key: string | null) =>
    queryOptions({
      queryKey: ["published-delivery", "by-ref-key", key],
      queryFn: () => publishedGuideDelivery.getPublishedGuidesByRefKey(key!),
      enabled: Boolean(key),
      retry,
    }),
  browseAreas: () =>
    queryOptions({
      queryKey: ["published-delivery", "browse-areas"],
      queryFn: () => publishedGuideDelivery.listPublishedBrowseAreas(),
      retry,
    }),
  browseContext: (key: string | null) =>
    queryOptions({
      queryKey: ["published-delivery", "browse-context", key],
      queryFn: () => publishedGuideDelivery.getPublishedBrowseContext(key!),
      enabled: Boolean(key),
      retry,
    }),
  search: (query: string) =>
    queryOptions({
      queryKey: ["published-delivery", "search", query.trim().toLowerCase()],
      queryFn: () => publishedGuideDelivery.searchPublishedGuides(query),
      enabled: query.trim().length > 0,
      retry,
    }),
  related: (guideId: string | null) =>
    queryOptions({
      queryKey: ["published-delivery", "related", guideId],
      queryFn: () => publishedGuideDelivery.getRelatedPublishedGuides(guideId!),
      enabled: Boolean(guideId),
      retry,
    }),
};

/**
 * Build 3C — Help Retrieval access. The Simulated Aura harness calls exactly
 * this boundary; it never reaches Guide Studio, seed data or the mock stores.
 */
export const helpRetrievalQueries = {
  contexts: () =>
    queryOptions({
      queryKey: ["help-retrieval", "contexts"],
      queryFn: () => helpRetrieval.listHelpContexts(),
      retry: composedRetry,
    }),
  retrieve: (request: AuraHelpRequest | null) =>
    queryOptions({
      queryKey: ["help-retrieval", "retrieve", request],
      queryFn: () => helpRetrieval.retrieve(request!),
      enabled: Boolean(request?.query.trim()),
      // Retrieval fans out across the delivery contract, so it tolerates more
      // transient retries before surfacing the safe "unavailable" state.
      retry: composedRetry,
    }),
};
