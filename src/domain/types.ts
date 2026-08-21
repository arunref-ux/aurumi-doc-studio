/**
 * Guide Studio domain + normalized external reference models.
 *
 * External systems (DevHarmony, Aurumi AI Studio, Connectors) OWN their
 * entities. Guide Studio only keeps normalized composite references to them
 * and owns Guides, GuideVersions and GuideAssociations.
 */

import type {
  ExternalEntityKind,
  ExternalEntityReference,
  GuideReferenceTarget,
  ReferenceKind,
  SourceSystem,
} from "./external-ref";

export type {
  ExternalEntityKind,
  ExternalEntityReference,
  GuideReferenceTarget,
  ReferenceKind,
  SourceSystem,
} from "./external-ref";
export { SOURCE_LABELS, refKey, refEquals } from "./external-ref";

/* ------------------------------------------------------------------ */
/* Normalized reference models (read models from external providers)   */
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

/**
 * Lifecycle state lives on GuideVersion — it is the single source of truth.
 * `GuideStatus` remains as a display alias only.
 */
export type GuideVersionStatus = "draft" | "in-review" | "approved" | "published" | "archived";
export type GuideStatus = GuideVersionStatus;

export const GUIDE_STATUS_LABELS: Record<GuideVersionStatus, string> = {
  draft: "Draft",
  "in-review": "In Review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export const GUIDE_STATUS_ORDER: GuideVersionStatus[] = [
  "draft",
  "in-review",
  "approved",
  "published",
  "archived",
];

/**
 * Lifecycle coverage rules live in `@/domain/guide-lifecycle` and are
 * re-exported here for convenience. Never re-derive them inline.
 */
export {
  AUTHORING_COVERAGE_STATUSES,
  PUBLISHED_COVERAGE_STATUSES,
  guideProvidesAuthoringCoverage,
  guideProvidesPublishedCoverage,
  providesAuthoringCoverage,
  providesPublishedCoverage,
} from "./guide-lifecycle";

export type AssociationKind = ReferenceKind;

/** Normalized association record keyed by composite external identity. */
export interface GuideAssociation {
  id: string;
  guideId: string;
  /** Composite identity: source + kind + externalId. */
  ref: GuideReferenceTarget;
  /** Denormalized label captured at association time (display fallback). */
  label: string;
  /** Optional parent external id, e.g. feature -> app, intent -> topic. */
  parentExternalId?: string;
}

/** Guide Studio-owned version record. Lifecycle authority. */
export interface GuideVersion {
  id: string;
  guideId: string;
  versionNumber: string;
  status: GuideVersionStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  publishedAt: string | null;
}

/** Guide record. Carries no scalar version or status of its own. */
export interface Guide {
  id: string;
  title: string;
  slug: string;
  summary: string;
  guideType: GuideType;
  currentVersionId: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  associations: GuideAssociation[];
}

/** Read model handed to the UI: version relationship resolved. */
export interface GuideWithVersion extends Guide {
  currentVersion: GuideVersion;
  versions: GuideVersion[];
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
  /** Filters on the current GuideVersion status. */
  status?: GuideVersionStatus | "all";
  guideType?: GuideType | "all";
  appExternalId?: string | "all";
  topicExternalId?: string | "all";
  connectorExternalId?: string | "all";
}

export interface GuideStatusCounts {
  total: number;
  byStatus: Record<GuideVersionStatus, number>;
}

/* ------------------------------------------------------------------ */
/* Coverage                                                            */
/* ------------------------------------------------------------------ */

/**
 * Coverage facts owned by Guide Studio, keyed by composite external identity.
 * Guide Studio knows nothing about the external hierarchies themselves.
 */
export interface CoverageFact {
  ref: GuideReferenceTarget;
  /** Any associated guide has any GuideVersion that provides authoring coverage. */
  authoringCoverage: boolean;
  /** At least one published GuideVersion associated. */
  publishedCoverage: boolean;
  guideCount: number;
}

export type CoverageState = "published" | "in-progress" | "not-started";

export const COVERAGE_STATE_LABELS: Record<CoverageState, string> = {
  published: "Published",
  "in-progress": "In Progress",
  "not-started": "Not Started",
};

export interface CoverageEntity {
  ref: ExternalEntityReference;
  name: string;
  parentName?: string;
  state: CoverageState;
  guideCount: number;
}

export interface CoverageBucket {
  label: string;
  kind: ExternalEntityKind;
  total: number;
  published: number;
  inProgress: number;
  notStarted: number;
  entities: CoverageEntity[];
}

export interface CoverageSummary {
  features: CoverageBucket;
  intents: CoverageBucket;
  capabilities: CoverageBucket;
}

/** Lookup map (composite key -> coverage state) used by the Sources explorer. */
export type CoverageStateIndex = Record<string, CoverageState>;
