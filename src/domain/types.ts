/**
 * Guide Studio domain + normalized external reference models.
 *
 * External systems (DevHarmony, Aurumi AI Studio, Connectors) OWN their
 * entities. Guide Studio only keeps normalized references to them.
 */

export type SourceSystem = "devharmony" | "ai-studio" | "connector" | "guide-studio";

export const SOURCE_LABELS: Record<SourceSystem, string> = {
  devharmony: "DevHarmony",
  "ai-studio": "AI Studio",
  connector: "Connector",
  "guide-studio": "Guide Studio",
};

/* ------------------------------------------------------------------ */
/* Normalized reference models                                         */
/* ------------------------------------------------------------------ */

export interface AppRef {
  source: "devharmony";
  externalId: string;
  name: string;
  description: string;
  featureCount: number;
}

export interface FeatureRef {
  source: "devharmony";
  externalId: string;
  appExternalId: string;
  name: string;
  description: string;
  latestVersion: string;
}

export interface FeatureVersionRef {
  source: "devharmony";
  externalId: string;
  featureExternalId: string;
  version: string;
  releasedAt: string;
  status: "current" | "deprecated";
}

export interface TopicRef {
  source: "ai-studio";
  externalId: string;
  name: string;
  description: string;
  intentCount: number;
}

export interface IntentRef {
  source: "ai-studio";
  externalId: string;
  topicExternalId: string;
  name: string;
  description: string;
  utteranceCount: number;
}

export interface ConnectorRef {
  source: "connector";
  externalId: string;
  name: string;
  vendor: string;
  category: string;
  capabilityCount: number;
}

export interface CapabilityRef {
  source: "connector";
  externalId: string;
  connectorExternalId: string;
  name: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/* Guide domain                                                        */
/* ------------------------------------------------------------------ */

export type GuideType =
  | "how-to"
  | "troubleshooting"
  | "concept"
  | "configuration"
  | "administration"
  | "connector-guide"
  | "policy-reference";

export const GUIDE_TYPE_LABELS: Record<GuideType, string> = {
  "how-to": "How-To Guide",
  troubleshooting: "Troubleshooting",
  concept: "Concept",
  configuration: "Configuration",
  administration: "Administration",
  "connector-guide": "Connector Guide",
  "policy-reference": "Policy / Reference",
};

export type GuideStatus = "draft" | "in-review" | "approved" | "published" | "archived";

export const GUIDE_STATUS_LABELS: Record<GuideStatus, string> = {
  draft: "Draft",
  "in-review": "In Review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export const GUIDE_STATUS_ORDER: GuideStatus[] = [
  "draft",
  "in-review",
  "approved",
  "published",
  "archived",
];

export type AssociationKind =
  | "app"
  | "feature"
  | "feature-version"
  | "topic"
  | "intent"
  | "connector"
  | "capability"
  | "related-guide";

/** Normalized association record: kind + source system + stable external id. */
export interface GuideAssociation {
  id: string;
  guideId: string;
  kind: AssociationKind;
  source: SourceSystem;
  externalId: string;
  /** Denormalized label captured at association time (display fallback). */
  label: string;
  /** Optional parent external id, e.g. feature -> app, intent -> topic. */
  parentExternalId?: string;
}

export interface Guide {
  id: string;
  title: string;
  slug: string;
  summary: string;
  guideType: GuideType;
  status: GuideStatus;
  currentVersion: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  associations: GuideAssociation[];
}

export interface GuideActivityEntry {
  id: string;
  guideId: string;
  actor: string;
  action: string;
  detail?: string;
  at: string;
}

export interface GuideQuery {
  search?: string;
  status?: GuideStatus | "all";
  guideType?: GuideType | "all";
  appExternalId?: string | "all";
  topicExternalId?: string | "all";
  connectorExternalId?: string | "all";
}

export interface CoverageBucket {
  label: string;
  total: number;
  covered: number;
  uncovered: number;
  uncoveredExamples: string[];
}

export interface CoverageSummary {
  features: CoverageBucket;
  intents: CoverageBucket;
  capabilities: CoverageBucket;
}

export interface GuideStatusCounts {
  total: number;
  byStatus: Record<GuideStatus, number>;
}
