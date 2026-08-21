import type { GuideVersion } from "./types";

/**
 * Build 2A.1 editing rules.
 *
 * Metadata and associations are editable only while the authoritative
 * GuideVersion is a Draft. Lifecycle transitions (submit / approve / publish)
 * arrive in later builds, so no other status may be mutated in place.
 */

export const EDITABLE_VERSION_STATUSES = ["draft"] as const;

export class GuideNotEditableError extends Error {
  constructor(guideId: string, status: string) {
    super(
      `Guide "${guideId}" cannot be edited: its current version is "${status}". Only draft versions are editable in this build.`,
    );
    this.name = "GuideNotEditableError";
  }
}

export function versionIsEditable(version: Pick<GuideVersion, "status">): boolean {
  return (EDITABLE_VERSION_STATUSES as readonly string[]).includes(version.status);
}

export function assertVersionEditable(
  guideId: string,
  version: Pick<GuideVersion, "status">,
): void {
  if (!versionIsEditable(version)) {
    throw new GuideNotEditableError(guideId, version.status);
  }
}

/** Guide title is the only required metadata field in this build. */
export class GuideMetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuideMetadataError";
  }
}

export function assertGuideMetadataValid(input: { title: string }): void {
  if (!input.title.trim()) {
    throw new GuideMetadataError("A guide title is required.");
  }
  if (input.title.trim().length > 160) {
    throw new GuideMetadataError("Guide title must be 160 characters or fewer.");
  }
}

/** Initial version constants — system controlled, never user selected. */
export const INITIAL_VERSION_NUMBER = "1.0";
export const INITIAL_VERSION_STATUS = "draft" as const;

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
