import type { GuideVersion, GuideVersionStatus } from "./types";

/**
 * Build 2C — centralized version-creation policy.
 *
 * Guide Studio separates two roles explicitly:
 *   - the WORKING version  (`Guide.currentVersionId`)
 *   - the PUBLISHED version (`Guide.publishedVersionId`)
 *
 * A new Draft version may only be created when no in-flight working version
 * exists, so a guide can never have two concurrently editable versions.
 */

/** Statuses that mean "still in flight" — blocks creating another draft. */
export const IN_FLIGHT_VERSION_STATUSES: readonly GuideVersionStatus[] = [
  "draft",
  "in-review",
  "approved",
];

export class GuideVersionCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuideVersionCreationError";
  }
}

export function versionIsInFlight(status: GuideVersionStatus): boolean {
  return IN_FLIGHT_VERSION_STATUSES.includes(status);
}

/** True when a new Draft version may be created from this working version. */
export function canCreateDraftVersion(currentStatus: GuideVersionStatus): boolean {
  return !versionIsInFlight(currentStatus);
}

export function assertCanCreateDraftVersion(guideId: string, current: GuideVersion): void {
  if (!canCreateDraftVersion(current.status)) {
    throw new GuideVersionCreationError(
      `Guide "${guideId}" already has an in-flight version (v${current.versionNumber} · ${current.status}). Complete or discard it before creating a new draft.`,
    );
  }
}

/**
 * Next draft version number: major increment of the highest existing major.
 * Numbering is system controlled — never user supplied.
 */
export function nextDraftVersionNumber(existing: readonly GuideVersion[]): string {
  const highestMajor = existing.reduce((max, version) => {
    const major = Number.parseInt(version.versionNumber.split(".")[0] ?? "0", 10);
    return Number.isFinite(major) && major > max ? major : max;
  }, 0);
  return `${highestMajor + 1}.0`;
}
