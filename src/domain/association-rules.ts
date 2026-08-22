import {
  InvalidReferenceError,
  isValidSourceKind,
  refKey,
  type GuideReferenceTarget,
} from "./external-ref";
import type { Guide, GuideAssociation } from "./types";

/**
 * Shared association integrity rules.
 *
 * The same rules run for provider initialization (seed / imported / hydrated
 * data), for runtime `createAssociation`, and for any future import path.
 * Rules are defined once here and never duplicated per call site.
 */

export class AssociationValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: string[],
  ) {
    super(message);
    this.name = "AssociationValidationError";
  }
}

interface CandidateAssociation {
  guideId: string;
  ref: { source: string; kind: string; externalId: string };
}

/** Rule 1: only a source system's own kinds may be referenced. */
function sourceKindIssue(candidate: CandidateAssociation): string | null {
  const { source, kind, externalId } = candidate.ref;
  if (!isValidSourceKind(source, kind)) {
    return `Guide "${candidate.guideId}": source "${source}" cannot own kind "${kind}" (externalId "${externalId}").`;
  }
  if (!externalId.trim()) {
    return `Guide "${candidate.guideId}": association of kind "${kind}" has an empty externalId.`;
  }
  return null;
}

/** Composite association key: guideId + source + kind + externalId. */
export function associationKey(candidate: CandidateAssociation): string {
  return `${candidate.guideId}::${refKey(candidate.ref)}`;
}

/**
 * Validates one candidate association against the rules plus the associations
 * already present on the guide. Throws on the first violation, matching the
 * runtime write path's fail-fast contract.
 */
export function assertAssociationValid(
  candidate: CandidateAssociation,
  existing: readonly GuideAssociation[],
): asserts candidate is CandidateAssociation & { ref: GuideReferenceTarget } {
  const issue = sourceKindIssue(candidate);
  if (issue) {
    throw new InvalidReferenceError(candidate.ref.source, candidate.ref.kind);
  }
  const key = associationKey(candidate);
  if (existing.some((association) => associationKey(association) === key)) {
    throw new AssociationValidationError(
      `Duplicate association: ${refKey(candidate.ref)} is already associated with guide ${candidate.guideId}.`,
      [key],
    );
  }
}

/**
 * Validates an entire guide store at initialization. Collects every issue so
 * bad seed or imported data fails clearly and early with an actionable report.
 */
export function validateGuideAssociations(guides: readonly Guide[]): void {
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const guide of guides) {
    for (const association of guide.associations) {
      if (association.guideId !== guide.id) {
        issues.push(
          `Association "${association.id}" declares guideId "${association.guideId}" but is stored on guide "${guide.id}".`,
        );
      }

      const candidate: CandidateAssociation = { guideId: guide.id, ref: association.ref };
      const issue = sourceKindIssue(candidate);
      if (issue) {
        issues.push(issue);
        continue;
      }

      const key = associationKey(candidate);
      if (seen.has(key)) {
        issues.push(
          `Duplicate association for guide "${guide.id}": ${refKey(association.ref)} appears more than once.`,
        );
        continue;
      }
      seen.add(key);
    }
  }

  if (issues.length > 0) {
    throw new AssociationValidationError(
      `Guide association validation failed with ${issues.length} issue(s):\n- ${issues.join("\n- ")}`,
      issues,
    );
  }
}

/**
 * Centralized GuideVersion integrity validation.
 *
 * Single path for seed data, hydrated/imported data, provider store
 * initialization and every staged runtime mutation. It collectively enforces:
 *  1. every GuideVersion belongs to an existing Guide;
 *  2. currentVersionId resolves to a version of that Guide;
 *  3. publishedVersionId, when present, resolves to a version of that Guide;
 *  4. a Guide has zero or one Published GuideVersion;
 *  5. an existing Published version exactly matches publishedVersionId;
 *  6. with no Published version, publishedVersionId must be null;
 *  7. versionNumber is unique within each Guide.
 */
export function validateGuideVersions(
  guides: readonly Guide[],
  versions: readonly { id: string; guideId: string; status?: string; versionNumber?: string }[],
): void {
  const issues: string[] = [];
  const byId = new Map(versions.map((version) => [version.id, version]));

  for (const guide of guides) {
    const current = byId.get(guide.currentVersionId);
    if (!current) {
      issues.push(`Guide "${guide.id}" references unknown currentVersionId "${guide.currentVersionId}".`);
    } else if (current.guideId !== guide.id) {
      issues.push(
        `Guide "${guide.id}" currentVersionId "${guide.currentVersionId}" belongs to guide "${current.guideId}".`,
      );
    }
  }

  for (const guide of guides) {
    if (guide.publishedVersionId === null) continue;
    const published = byId.get(guide.publishedVersionId);
    if (!published) {
      issues.push(
        `Guide "${guide.id}" references unknown publishedVersionId "${guide.publishedVersionId}".`,
      );
    } else if (published.guideId !== guide.id) {
      issues.push(
        `Guide "${guide.id}" publishedVersionId "${guide.publishedVersionId}" belongs to guide "${published.guideId}".`,
      );
    } else if (published.status !== "published") {
      issues.push(
        `Guide "${guide.id}" publishedVersionId "${guide.publishedVersionId}" has status "${published.status}"; it must be "published".`,
      );
    }
  }

  for (const version of versions) {
    if (!guides.some((guide) => guide.id === version.guideId)) {
      issues.push(`GuideVersion "${version.id}" references unknown guide "${version.guideId}".`);
    }
  }

  /**
   * Rules 4-7 are guide-scoped, so they are evaluated per guide over that
   * guide's own versions only. Different guides may reuse version numbers.
   */
  for (const guide of guides) {
    const own = versions.filter((version) => version.guideId === guide.id);

    // Rule 7: (guideId, versionNumber) uniqueness.
    const seenNumbers = new Set<string>();
    for (const version of own) {
      const number = version.versionNumber;
      if (number === undefined) continue;
      if (seenNumbers.has(number)) {
        issues.push(
          `Guide "${guide.id}" has more than one GuideVersion with versionNumber "${number}".`,
        );
        continue;
      }
      seenNumbers.add(number);
    }

    // Rules 4-6: exactly zero or one Published version, pointer consistent.
    const publishedVersions = own.filter((version) => version.status === "published");
    if (publishedVersions.length > 1) {
      issues.push(
        `Guide "${guide.id}" has ${publishedVersions.length} Published GuideVersions (${publishedVersions
          .map((version) => version.id)
          .join(", ")}); at most one is allowed.`,
      );
    } else if (publishedVersions.length === 1) {
      const only = publishedVersions[0]!;
      if (guide.publishedVersionId !== only.id) {
        issues.push(
          `Guide "${guide.id}" has Published version "${only.id}" but publishedVersionId is "${guide.publishedVersionId ?? "null"}".`,
        );
      }
    } else if (guide.publishedVersionId !== null) {
      issues.push(
        `Guide "${guide.id}" has no Published GuideVersion but publishedVersionId is "${guide.publishedVersionId}".`,
      );
    }
  }

  if (issues.length > 0) {
    throw new AssociationValidationError(
      `Guide version validation failed with ${issues.length} issue(s):\n- ${issues.join("\n- ")}`,
      issues,
    );
  }
}

