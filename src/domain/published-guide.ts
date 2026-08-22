/**
 * Build 3A — Published Guide delivery projection (domain layer).
 *
 * The consumer-facing read model and the FAIL-CLOSED resolution rule that maps
 * an internal Guide + GuideVersion pair onto consumable published content.
 *
 * The authoritative live reference is ALWAYS `Guide.publishedVersionId`. There
 * is deliberately no fallback that searches for "any published version".
 */

import { refKey } from "./external-ref";
import type { GuideReferenceTarget, GuideType, GuideVersion, GuideWithVersion } from "./types";

/** Consumer-facing association projection (composite identity + display label). */
export interface PublishedGuideAssociation {
  ref: GuideReferenceTarget;
  label: string;
  parentExternalId?: string;
}

/**
 * Consumer-facing published guide. Carries no authoring or workflow state:
 * no draft status, no review state, no workflow events, no permissions.
 */
export interface PublishedGuide {
  guideId: string;
  slug: string;
  publishedVersionId: string;
  versionNumber: string;
  title: string;
  summary: string;
  guideType: GuideType;
  /** Canonical published content. Markdown is the only persisted format. */
  contentMarkdown: string;
  associations: PublishedGuideAssociation[];
  /** Composite association keys, precomputed for contextual retrieval. */
  refKeys: string[];
  publishedAt: string;
  publishedBy: string;
}

/** The only GuideVersion status consumable through the delivery boundary. */
export const DELIVERABLE_VERSION_STATUS = "published" as const;

/**
 * Fail-closed resolution. Returns null unless every integrity condition holds:
 * guide exists, publishedVersionId is a real non-blank pointer, the referenced
 * version exists, belongs to this guide, and its status is Published.
 */
export function resolvePublishedGuide(guide: GuideWithVersion | null): PublishedGuide | null {
  if (!guide) return null;

  const pointer = guide.publishedVersionId;
  if (typeof pointer !== "string" || !pointer.trim()) return null;

  const version: GuideVersion | undefined = guide.versions.find((item) => item.id === pointer);
  if (!version) return null;
  if (version.guideId !== guide.id) return null;
  if (version.status !== DELIVERABLE_VERSION_STATUS) return null;

  const associations: PublishedGuideAssociation[] = guide.associations.map((association) => ({
    ref: association.ref,
    label: association.label,
    ...(association.parentExternalId ? { parentExternalId: association.parentExternalId } : {}),
  }));

  return {
    guideId: guide.id,
    slug: guide.slug,
    publishedVersionId: version.id,
    versionNumber: version.versionNumber,
    title: guide.title,
    summary: guide.summary,
    guideType: guide.guideType,
    contentMarkdown: version.contentMarkdown,
    associations,
    refKeys: associations.map((association) => refKey(association.ref)),
    publishedAt: version.publishedAt ?? version.updatedAt,
    publishedBy: version.updatedBy,
  };
}

/** Deterministic consumer ordering: title ascending, guideId as tie-breaker. */
export function comparePublishedGuides(a: PublishedGuide, b: PublishedGuide): number {
  const byTitle = a.title.localeCompare(b.title);
  return byTitle !== 0 ? byTitle : a.guideId.localeCompare(b.guideId);
}
