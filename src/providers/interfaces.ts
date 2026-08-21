import type {
  AppRef,
  CapabilityRef,
  ConnectorRef,
  CoverageFact,
  FeatureRef,
  FeatureVersionRef,
  GuideActivityEntry,
  GuideAssociation,
  GuideQuery,
  GuideReferenceTarget,
  GuideStatusCounts,
  GuideVersion,
  GuideWithVersion,
  IntentRef,
  TopicRef,
} from "@/domain/types";

/**
 * Provider contracts. Mock implementations satisfy these today; real HTTP
 * implementations can be dropped in later without touching the UI.
 *
 * External hierarchies are ONLY reachable through these interfaces — no
 * consumer may import external seed data directly.
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

export interface CreateAssociationInput {
  guideId: string;
  ref: GuideReferenceTarget;
  label: string;
  parentExternalId?: string;
}

export interface RemoveAssociationInput {
  guideId: string;
  ref: GuideReferenceTarget;
}

/** Association draft carried by Create/Update, before it has an id. */
export interface AssociationDraft {
  ref: GuideReferenceTarget;
  label: string;
  parentExternalId?: string;
}

export interface CreateGuideInput {
  title: string;
  summary: string;
  guideType: GuideType;
  /** Display name of the acting user; authorization happens in the command bus. */
  actor: string;
  associations?: AssociationDraft[];
}

export interface UpdateGuideInput {
  guideId: string;
  title: string;
  summary: string;
  guideType: GuideType;
  actor: string;
}


/**
 * Guide Studio owns Guides, GuideVersions and GuideAssociations only.
 * It never enumerates external hierarchies.
 */
export interface GuideStudioProvider {
  listGuides(query?: GuideQuery): Promise<GuideWithVersion[]>;
  getGuide(idOrSlug: string): Promise<GuideWithVersion | null>;
  getGuideVersions(guideId: string): Promise<GuideVersion[]>;
  getGuideActivity(guideId: string): Promise<GuideActivityEntry[]>;
  getStatusCounts(): Promise<GuideStatusCounts>;
  getRecentActivity(limit?: number): Promise<GuideActivityEntry[]>;
  /**
   * Coverage facts derived purely from Guide Studio-owned data, keyed by
   * composite external identity (source + kind + externalId).
   */
  getCoverageFacts(): Promise<CoverageFact[]>;
  /**
   * Mutation: validates source/kind combination and composite uniqueness at
   * the domain boundary. Only callable through the command bus.
   */
  createAssociation(input: CreateAssociationInput): Promise<GuideAssociation>;
}

export interface ProviderRegistry {
  devHarmony: DevHarmonyProvider;
  aiStudio: AIStudioProvider;
  connectors: ConnectorProvider;
  guideStudio: GuideStudioProvider;
}
