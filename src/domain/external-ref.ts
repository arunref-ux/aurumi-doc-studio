/**
 * Composite external entity identity.
 *
 * A bare `externalId` is NOT an identity: two source systems may legitimately
 * mint the same id, and an App reference must never satisfy Feature coverage.
 * Identity is always source + kind + externalId.
 */

export type SourceSystem = "devharmony" | "ai-studio" | "connector" | "guide-studio";

export const SOURCE_LABELS: Record<SourceSystem, string> = {
  devharmony: "DevHarmony",
  "ai-studio": "AI Studio",
  connector: "Connector",
  "guide-studio": "Guide Studio",
};

export type ExternalEntityKind =
  | "app"
  | "feature"
  | "topic"
  | "intent"
  | "connector"
  | "capability";

export type ReferenceKind = ExternalEntityKind | "related-guide";

/**
 * Discriminated union: only valid source/kind combinations are representable.
 */
export type ExternalEntityReference =
  | { source: "devharmony"; kind: "app" | "feature"; externalId: string }
  | { source: "ai-studio"; kind: "topic" | "intent"; externalId: string }
  | { source: "connector"; kind: "connector" | "capability"; externalId: string };

/** Guide Studio-owned reference (guide-to-guide relationships). */
export interface InternalGuideReference {
  source: "guide-studio";
  kind: "related-guide";
  externalId: string;
}

export type GuideReferenceTarget = ExternalEntityReference | InternalGuideReference;

/** Source system -> kinds it is allowed to own. */
export const VALID_SOURCE_KINDS: Record<SourceSystem, ReferenceKind[]> = {
  devharmony: ["app", "feature"],
  "ai-studio": ["topic", "intent"],
  connector: ["connector", "capability"],
  "guide-studio": ["related-guide"],
};

export const REFERENCE_KIND_LABELS: Record<ReferenceKind, string> = {
  app: "App",
  feature: "Feature",
  topic: "Topic",
  intent: "Intent",
  connector: "Connector",
  capability: "Capability",
  "related-guide": "Related Guide",
};

export function isValidSourceKind(source: string, kind: string): boolean {
  const allowed = VALID_SOURCE_KINDS[source as SourceSystem];
  return Boolean(allowed?.includes(kind as ReferenceKind));
}

/** Canonical opaque key. Never compare bare external ids. */
export function refKey(ref: { source: string; kind: string; externalId: string }): string {
  return `${ref.source}::${ref.kind}::${ref.externalId}`;
}

export function refEquals(
  a: { source: string; kind: string; externalId: string },
  b: { source: string; kind: string; externalId: string },
): boolean {
  return refKey(a) === refKey(b);
}

export class InvalidReferenceError extends Error {
  constructor(source: string, kind: string) {
    super(`Invalid Guide Studio reference: source "${source}" cannot own kind "${kind}".`);
    this.name = "InvalidReferenceError";
  }
}

/** Domain guard used at the Guide Studio provider boundary. */
export function assertValidReference(ref: {
  source: string;
  kind: string;
  externalId: string;
}): asserts ref is GuideReferenceTarget {
  if (!isValidSourceKind(ref.source, ref.kind)) {
    throw new InvalidReferenceError(ref.source, ref.kind);
  }
  if (!ref.externalId.trim()) {
    throw new InvalidReferenceError(ref.source, ref.kind);
  }
}

/**
 * Validating factory for any guide reference target (external or internal).
 * Seed data, imports and hydration MUST build references through this instead
 * of asserting types, so unsafe casts cannot bypass integrity rules.
 */
export function guideRef(
  source: string,
  kind: string,
  externalId: string,
): GuideReferenceTarget {
  const candidate = { source, kind, externalId };
  assertValidReference(candidate);
  return candidate;
}

export function externalRef(
  source: ExternalEntityReference["source"],
  kind: ExternalEntityKind,
  externalId: string,
): ExternalEntityReference {
  const candidate = { source, kind, externalId };
  assertValidReference(candidate);
  return candidate as ExternalEntityReference;
}
