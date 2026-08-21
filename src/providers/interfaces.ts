import type {
  AppRef,
  CapabilityRef,
  ConnectorRef,
  CoverageSummary,
  FeatureRef,
  FeatureVersionRef,
  Guide,
  GuideActivityEntry,
  GuideQuery,
  GuideStatusCounts,
  IntentRef,
  TopicRef,
} from "@/domain/types";

/**
 * Provider contracts. Mock implementations satisfy these today; real HTTP
 * implementations can be dropped in later without touching the UI.
 */

export interface DevHarmonyProvider {
  getApps(): Promise<AppRef[]>;
  getFeaturesByApp(appId: string): Promise<FeatureRef[]>;
  getFeatureVersions(featureId: string): Promise<FeatureVersionRef[]>;
}

export interface AIStudioProvider {
  getTopics(): Promise<TopicRef[]>;
  getIntentsByTopic(topicId: string): Promise<IntentRef[]>;
}

export interface ConnectorProvider {
  getConnectors(): Promise<ConnectorRef[]>;
  getCapabilitiesByConnector(connectorId: string): Promise<CapabilityRef[]>;
}

export interface GuideStudioProvider {
  listGuides(query?: GuideQuery): Promise<Guide[]>;
  getGuide(idOrSlug: string): Promise<Guide | null>;
  getGuideActivity(guideId: string): Promise<GuideActivityEntry[]>;
  getStatusCounts(): Promise<GuideStatusCounts>;
  getRecentActivity(limit?: number): Promise<GuideActivityEntry[]>;
  /** Coverage is computed across provider hierarchies + guide associations. */
  getCoverageSummary(): Promise<CoverageSummary>;
  /** External ids (any source) that have at least one guide associated. */
  getCoveredExternalIds(): Promise<string[]>;
}

export interface ProviderRegistry {
  devHarmony: DevHarmonyProvider;
  aiStudio: AIStudioProvider;
  connectors: ConnectorProvider;
  guideStudio: GuideStudioProvider;
}
