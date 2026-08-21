import type { GuideVersion, GuideVersionStatus } from "./types";

/**
 * Single source of truth for GuideVersion lifecycle coverage semantics.
 *
 * Coverage code MUST NOT inline lifecycle checks such as
 * `status !== "archived"` or `status === "published"`. Changing the lifecycle
 * later should only require editing this module.
 */

/** Statuses whose versions count as authored documentation. */
export const AUTHORING_COVERAGE_STATUSES: readonly GuideVersionStatus[] = [
  "draft",
  "in-review",
  "approved",
  "published",
];

/** Statuses whose versions count as published documentation. */
export const PUBLISHED_COVERAGE_STATUSES: readonly GuideVersionStatus[] = ["published"];

export function statusProvidesAuthoringCoverage(status: GuideVersionStatus): boolean {
  return AUTHORING_COVERAGE_STATUSES.includes(status);
}

export function statusProvidesPublishedCoverage(status: GuideVersionStatus): boolean {
  return PUBLISHED_COVERAGE_STATUSES.includes(status);
}

/** A single version's contribution to authoring coverage. */
export function providesAuthoringCoverage(version: GuideVersion): boolean {
  return statusProvidesAuthoringCoverage(version.status);
}

/** A single version's contribution to published coverage. */
export function providesPublishedCoverage(version: GuideVersion): boolean {
  return statusProvidesPublishedCoverage(version.status);
}

/**
 * Guide-level rollups. Every version of the guide is evaluated — never only
 * `currentVersionId` — so historical coverage is not lost when a newer draft
 * becomes current, nor when the current version is archived.
 */
export function guideProvidesAuthoringCoverage(versions: readonly GuideVersion[]): boolean {
  return versions.some(providesAuthoringCoverage);
}

export function guideProvidesPublishedCoverage(versions: readonly GuideVersion[]): boolean {
  return versions.some(providesPublishedCoverage);
}
