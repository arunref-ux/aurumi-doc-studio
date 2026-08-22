import { seedActivity, seedGuideVersions, seedGuides } from "@/data/seed/guides";
import {
  assertAssociationValid,
  validateGuideAssociations,
  validateGuideVersions,
} from "@/domain/association-rules";
import { refKey } from "@/domain/external-ref";
import {
  guideProvidesAuthoringCoverage,
  guideProvidesPublishedCoverage,
} from "@/domain/guide-lifecycle";
import { assertContentMarkdownValid, EMPTY_CONTENT_MARKDOWN } from "@/domain/guide-content";
import {
  assertGuideMetadataValid,
  assertVersionEditable,
  INITIAL_VERSION_NUMBER,
  INITIAL_VERSION_STATUS,
  slugifyTitle,
} from "@/domain/guide-editing";
import {
  GUIDE_WORKFLOW_EVENT_LABELS,
  requireCurrentGuideVersion,
  resolveGuideVersionTransition,
  resolveSupersedeTransition,
  type GuideVersionWorkflowEvent,
  type GuideWorkflowAction,
} from "@/domain/guide-workflow";
import {
  assertCanCreateDraftVersion,
  nextDraftVersionNumber,
} from "@/domain/guide-versioning";
import {
  GUIDE_STATUS_ORDER,
  GUIDE_TYPE_LABELS,
  type CoverageFact,
  type Guide,
  type GuideActivityEntry,
  type GuideAssociation,
  type GuideQuery,
  type GuideVersion,
  type GuideVersionStatus,
  type GuideWithVersion,
} from "@/domain/types";
import type {
  CreateAssociationInput,
  CreateGuideDraftVersionInput,
  CreateGuideInput,
  GuideStudioProvider,
  GuideWorkflowTransitionInput,
  RemoveAssociationInput,
  UpdateGuideDraftInput,
} from "@/providers/interfaces";
import { clone, simulateRequest } from "./latency";

/**
 * Guide Studio-owned mock store. It knows NOTHING about the external mock
 * persistence structure — no DevHarmony / AI Studio / Connector seed imports.
 */
const guides: Guide[] = seedGuides.map((guide) => ({ ...guide }));
const versions: GuideVersion[] = seedGuideVersions.map((version) => ({ ...version }));
const activity: GuideActivityEntry[] = seedActivity.map((entry) => ({ ...entry }));
/** Build 2B: minimal version-level workflow audit trail. */
const workflowEvents: GuideVersionWorkflowEvent[] = [];

/**
 * Store initialization integrity gate. Seed, imported and future hydrated data
 * pass through exactly the same rules as runtime writes, so invalid source/kind
 * combinations or duplicate composite associations fail early and loudly.
 */
validateGuideAssociations(guides);
validateGuideVersions(guides, versions);

function versionsOf(guideId: string): GuideVersion[] {
  return versions.filter((version) => version.guideId === guideId);
}

function currentVersion(guide: Guide): GuideVersion {
  const version = versions.find((item) => item.id === guide.currentVersionId);
  if (!version) {
    throw new Error(`Guide ${guide.id} has no current GuideVersion record.`);
  }
  return version;
}

/** Resolved published version — explicitly separate from the working version. */
function publishedVersion(guide: Guide): GuideVersion | null {
  if (guide.publishedVersionId === null) return null;
  const version = versions.find((item) => item.id === guide.publishedVersionId);
  if (!version) {
    throw new Error(`Guide ${guide.id} references an unknown published GuideVersion.`);
  }
  return version;
}

function withVersion(guide: Guide): GuideWithVersion {
  return {
    ...guide,
    currentVersion: currentVersion(guide),
    publishedVersion: publishedVersion(guide),
    versions: versionsOf(guide.id),
  };
}

function matches(guide: GuideWithVersion, query: GuideQuery): boolean {
  const term = query.search?.trim().toLowerCase();
  if (term) {
    const haystack = [guide.title, guide.summary, GUIDE_TYPE_LABELS[guide.guideType], guide.owner]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(term)) return false;
  }
  if (query.status && query.status !== "all" && guide.currentVersion.status !== query.status) {
    return false;
  }
  if (query.guideType && query.guideType !== "all" && guide.guideType !== query.guideType) {
    return false;
  }

  const hasRef = (source: string, kind: string, externalId: string) =>
    guide.associations.some(
      (association) => refKey(association.ref) === refKey({ source, kind, externalId }),
    );

  if (
    query.appExternalId &&
    query.appExternalId !== "all" &&
    !hasRef("devharmony", "app", query.appExternalId)
  ) {
    return false;
  }
  if (
    query.topicExternalId &&
    query.topicExternalId !== "all" &&
    !hasRef("ai-studio", "topic", query.topicExternalId)
  ) {
    return false;
  }
  if (
    query.connectorExternalId &&
    query.connectorExternalId !== "all" &&
    !hasRef("connector", "connector", query.connectorExternalId)
  ) {
    return false;
  }

  return true;
}

/**
 * Coverage facts: composite-key indexed, derived from ALL GuideVersions of each
 * associated guide (never only `currentVersionId`). Lifecycle rules come from
 * the centralized helpers in `@/domain/guide-lifecycle`.
 */
function coverageFacts(): CoverageFact[] {
  const index = new Map<string, CoverageFact>();

  for (const guide of guides) {
    const guideVersions = versionsOf(guide.id);
    const authoring = guideProvidesAuthoringCoverage(guideVersions);
    const published = guideProvidesPublishedCoverage(guideVersions);
    if (!authoring && !published) continue;

    for (const association of guide.associations) {
      const key = refKey(association.ref);
      const existing = index.get(key);
      if (existing) {
        existing.authoringCoverage = existing.authoringCoverage || authoring;
        existing.publishedCoverage = existing.publishedCoverage || published;
        existing.guideCount += 1;
      } else {
        index.set(key, {
          ref: association.ref,
          authoringCoverage: authoring,
          publishedCoverage: published,
          guideCount: 1,
        });
      }
    }
  }

  return Array.from(index.values());
}

/* ------------------------------------------------------------------ */
/* Mutation helpers                                                    */
/* ------------------------------------------------------------------ */

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
}

/** Guide ids stay slug-derived and unique across the store. */
function uniqueGuideId(title: string): string {
  const base = slugifyTitle(title) || "guide";
  let candidate = `guide-${base}`;
  let suffix = 2;
  while (guides.some((guide) => guide.id === candidate)) {
    candidate = `guide-${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function uniqueSlug(title: string, guideId: string): string {
  const base = slugifyTitle(title) || guideId;
  let candidate = base;
  let suffix = 2;
  while (guides.some((guide) => guide.slug === candidate && guide.id !== guideId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function requireGuide(guideId: string): Guide {
  const guide = guides.find((item) => item.id === guideId);
  if (!guide) throw new Error(`Unknown guide: ${guideId}`);
  return guide;
}

/**
 * Single atomic workflow transition primitive (Build 2B).
 *
 * Staged validation -> single commit. Authorization already happened at the
 * command boundary; this boundary independently enforces the lifecycle policy,
 * so bypassing the UI cannot produce an illegal status. The status change and
 * its workflow event are written together — neither can exist without the other.
 */
function transition(
  action: GuideWorkflowAction,
  input: GuideWorkflowTransitionInput,
): GuideWithVersion {
  const guide = requireGuide(input.guideId);
  const version = currentVersion(guide);

  // Strict version identity: explicit, non-blank, exactly the current version.
  requireCurrentGuideVersion(input.guideVersionId, version.id);

  // Centralized lifecycle policy — the only place a target status is resolved.
  const toStatus = resolveGuideVersionTransition(version.status, action);

  const now = new Date().toISOString();
  const note = input.note?.trim();
  const stagedEvent: GuideVersionWorkflowEvent = {
    id: nextId(`${guide.id}-wf`),
    guideId: guide.id,
    guideVersionId: version.id,
    action,
    fromStatus: version.status,
    toStatus,
    performedAt: now,
    performedBy: input.actor,
    ...(note ? { note } : {}),
  };

  /**
   * Build 2C publish side effects, staged before any commit: the previously
   * published version is superseded (archived) through the system transition,
   * and the guide's published pointer moves to this version.
   */
  const supersedeTarget =
    action === "publish"
      ? versions.find(
          (item) => item.id === guide.publishedVersionId && item.id !== version.id,
        ) ?? null
      : null;
  const supersededStatus = supersedeTarget ? resolveSupersedeTransition(supersedeTarget.status) : null;
  const stagedSupersedeEvent: GuideVersionWorkflowEvent | null =
    supersedeTarget && supersededStatus
      ? {
          id: nextId(`${guide.id}-wf`),
          guideId: guide.id,
          guideVersionId: supersedeTarget.id,
          action: "supersede",
          fromStatus: supersedeTarget.status,
          toStatus: supersededStatus,
          performedAt: now,
          performedBy: input.actor,
        }
      : null;

  // ---- commit (status + event together) ----
  version.status = toStatus;
  version.updatedAt = now;
  version.updatedBy = input.actor;
  guide.updatedAt = now;
  if (action === "publish") {
    version.publishedAt = now;
    guide.publishedVersionId = version.id;
    if (supersedeTarget && supersededStatus && stagedSupersedeEvent) {
      supersedeTarget.status = supersededStatus;
      supersedeTarget.updatedAt = now;
      supersedeTarget.updatedBy = input.actor;
      workflowEvents.push(stagedSupersedeEvent);
      activity.push({
        id: nextId(`${guide.id}-activity`),
        guideId: guide.id,
        actor: input.actor,
        action: GUIDE_WORKFLOW_EVENT_LABELS.supersede,
        detail: `Version ${supersedeTarget.versionNumber} archived`,
        at: now,
      });
    }
  }
  workflowEvents.push(stagedEvent);
  activity.push({
    id: nextId(`${guide.id}-activity`),
    guideId: guide.id,
    actor: input.actor,
    action: GUIDE_WORKFLOW_EVENT_LABELS[action],
    detail: note
      ? `Version ${version.versionNumber} · ${note}`
      : `Version ${version.versionNumber}`,
    at: now,
  });

  return withVersion(guide);
}

export const mockGuideStudioProvider: GuideStudioProvider = {
  listGuides: (query = {}) =>
    simulateRequest(
      () =>
        clone(
          guides
            .map(withVersion)
            .filter((guide) => matches(guide, query))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        ),
      { label: "Guide Studio Guides API", failureRate: 0.03 },
    ),

  getGuide: (idOrSlug) =>
    simulateRequest(
      () => {
        const guide = guides.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
        return guide ? clone(withVersion(guide)) : null;
      },
      { label: "Guide Studio Guide API" },
    ),

  getGuideVersions: (guideId) =>
    simulateRequest(() => clone(versionsOf(guideId)), { label: "Guide Studio Versions API" }),

  getGuideActivity: (guideId) =>
    simulateRequest(
      () =>
        clone(
          activity
            .filter((entry) => entry.guideId === guideId)
            .sort((a, b) => b.at.localeCompare(a.at)),
        ),
      { label: "Guide Studio Activity API", minLatency: 140, maxLatency: 360 },
    ),

  getStatusCounts: () =>
    simulateRequest(
      () => {
        const byStatus = GUIDE_STATUS_ORDER.reduce(
          (acc, status) => {
            acc[status] = guides.filter((guide) => currentVersion(guide).status === status).length;
            return acc;
          },
          {} as Record<GuideVersionStatus, number>,
        );
        return { total: guides.length, byStatus };
      },
      { label: "Guide Studio Metrics API" },
    ),

  getRecentActivity: (limit = 8) =>
    simulateRequest(
      () => clone([...activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)),
      { label: "Guide Studio Activity API" },
    ),

  getCoverageFacts: () =>
    simulateRequest(() => clone(coverageFacts()), { label: "Guide Coverage Index API" }),

  createAssociation: (input: CreateAssociationInput) =>
    simulateRequest(
      () => {
        const guide = requireGuide(input.guideId);
        assertVersionEditable(guide.id, currentVersion(guide));

        // Shared domain rules: valid source/kind combination and composite
        // uniqueness of guideId + source + kind + externalId. Identical to the
        // initialization gate above.
        assertAssociationValid({ guideId: guide.id, ref: input.ref }, guide.associations);

        const association: GuideAssociation = {
          id: nextId(`${guide.id}-assoc`),
          guideId: guide.id,
          ref: input.ref,
          label: input.label,
          ...(input.parentExternalId ? { parentExternalId: input.parentExternalId } : {}),
        };
        guide.associations = [...guide.associations, association];
        return clone(association);
      },
      { label: "Guide Studio Association API" },
    ),

  removeAssociation: (input: RemoveAssociationInput) =>
    simulateRequest(
      () => {
        const guide = requireGuide(input.guideId);
        assertVersionEditable(guide.id, currentVersion(guide));
        const key = refKey(input.ref);
        const next = guide.associations.filter((association) => refKey(association.ref) !== key);
        if (next.length === guide.associations.length) {
          throw new Error(`Association ${key} is not present on guide ${guide.id}.`);
        }
        guide.associations = next;
      },
      { label: "Guide Studio Association API" },
    ),

  /**
   * Atomic Guide + initial GuideVersion creation.
   *
   * Every record is built and validated in a staging area first; the store is
   * only mutated once all domain rules pass, so a failure can never leave an
   * orphaned Guide or GuideVersion behind (mock equivalent of a transaction).
   */
  createGuide: (input: CreateGuideInput) =>
    simulateRequest(
      () => {
        assertGuideMetadataValid(input);

        const title = input.title.trim();
        const now = new Date().toISOString();
        const guideId = uniqueGuideId(title);
        const versionId = `${guideId}-v${INITIAL_VERSION_NUMBER}`;

        const stagedAssociations: GuideAssociation[] = [];
        for (const draft of input.associations ?? []) {
          // Same shared rules as initialization and runtime association writes.
          assertAssociationValid({ guideId, ref: draft.ref }, stagedAssociations);
          stagedAssociations.push({
            id: nextId(`${guideId}-assoc`),
            guideId,
            ref: draft.ref,
            label: draft.label,
            ...(draft.parentExternalId ? { parentExternalId: draft.parentExternalId } : {}),
          });
        }

        const stagedGuide: Guide = {
          id: guideId,
          title,
          slug: uniqueSlug(title, guideId),
          summary: input.summary.trim(),
          guideType: input.guideType,
          currentVersionId: versionId,
          publishedVersionId: null,
          owner: input.actor,
          createdAt: now,
          updatedAt: now,
          associations: stagedAssociations,
        };

        const stagedVersion: GuideVersion = {
          id: versionId,
          guideId,
          versionNumber: INITIAL_VERSION_NUMBER,
          status: INITIAL_VERSION_STATUS,
          contentMarkdown: EMPTY_CONTENT_MARKDOWN,
          createdAt: now,
          createdBy: input.actor,
          updatedAt: now,
          updatedBy: input.actor,
          publishedAt: null,
        };

        // Full-store integrity gate before commit: either both records are
        // valid together, or nothing is written.
        const candidateGuides = [...guides, stagedGuide];
        const candidateVersions = [...versions, stagedVersion];
        validateGuideAssociations(candidateGuides);
        validateGuideVersions(candidateGuides, candidateVersions);

        guides.push(stagedGuide);
        versions.push(stagedVersion);
        activity.push({
          id: nextId(`${guideId}-activity`),
          guideId,
          actor: input.actor,
          action: "Draft created",
          detail: `Version ${INITIAL_VERSION_NUMBER}`,
          at: now,
        });

        return clone(withVersion(stagedGuide));
      },
      { label: "Guide Studio Guide API" },
    ),

  /**
   * Single logical draft update.
   *
   * Metadata AND the complete association set are validated in a staging area
   * against the whole candidate store first; the persisted Guide is only
   * mutated once every rule passes, so a validation failure (or a throw) can
   * never leave metadata updated with associations rejected, or vice versa.
   * `guideType` is not part of this contract and is never mutated here.
   */
  updateGuideDraft: (input: UpdateGuideDraftInput) =>
    simulateRequest(
      () => {
        const guide = requireGuide(input.guideId);
        const version = currentVersion(guide);
        assertVersionEditable(guide.id, version);
        assertGuideMetadataValid(input);
        // Content is validated with metadata and associations BEFORE any commit.
        assertContentMarkdownValid(input.contentMarkdown);

        const now = new Date().toISOString();
        const title = input.title.trim();

        // ---- stage associations (same shared rules as create/init) ----
        const existingByKey = new Map(
          guide.associations.map((association) => [refKey(association.ref), association]),
        );
        const stagedAssociations: GuideAssociation[] = [];
        for (const draft of input.associations) {
          assertAssociationValid({ guideId: guide.id, ref: draft.ref }, stagedAssociations);
          const existing = existingByKey.get(refKey(draft.ref));
          stagedAssociations.push({
            id: existing?.id ?? nextId(`${guide.id}-assoc`),
            guideId: guide.id,
            ref: draft.ref,
            label: draft.label,
            ...(draft.parentExternalId ? { parentExternalId: draft.parentExternalId } : {}),
          });
        }

        // ---- full-store integrity gate before any commit ----
        const stagedGuide: Guide = {
          ...guide,
          title,
          slug: uniqueSlug(title, guide.id),
          summary: input.summary.trim(),
          updatedAt: now,
          associations: stagedAssociations,
        };
        const candidateGuides = guides.map((item) => (item.id === guide.id ? stagedGuide : item));
        validateGuideAssociations(candidateGuides);
        validateGuideVersions(candidateGuides, versions);

        // ---- commit ----
        guide.title = stagedGuide.title;
        guide.slug = stagedGuide.slug;
        guide.summary = stagedGuide.summary;
        guide.associations = stagedAssociations;
        guide.updatedAt = now;

        // GuideVersion remains the lifecycle AND content authority: status is
        // untouched, content and edit provenance move forward together.
        version.contentMarkdown = input.contentMarkdown;
        version.updatedAt = now;
        version.updatedBy = input.actor;

        activity.push({
          id: nextId(`${guide.id}-activity`),
          guideId: guide.id,
          actor: input.actor,
          action: "Draft saved",
          detail: `Version ${version.versionNumber}`,
          at: now,
        });

        return clone(withVersion(guide));
      },
      { label: "Guide Studio Guide API" },
    ),

  getWorkflowEvents: (guideId) =>
    simulateRequest(
      () =>
        clone(
          workflowEvents
            .filter((event) => event.guideId === guideId)
            .sort((a, b) => b.performedAt.localeCompare(a.performedAt)),
        ),
      { label: "Guide Workflow History API", minLatency: 120, maxLatency: 320 },
    ),

  submitGuideVersionForReview: (input) =>
    simulateRequest(() => clone(transition("submit_for_review", input)), {
      label: "Guide Workflow API",
    }),

  requestGuideVersionChanges: (input) =>
    simulateRequest(() => clone(transition("request_changes", input)), {
      label: "Guide Workflow API",
    }),

  approveGuideVersion: (input) =>
    simulateRequest(() => clone(transition("approve", input)), {
      label: "Guide Workflow API",
    }),

  publishGuideVersion: (input) =>
    simulateRequest(() => clone(transition("publish", input)), {
      label: "Guide Publishing API",
    }),

  /**
   * Build 2C: new Draft version from an existing Guide.
   *
   * Staged validation -> single commit. The published version and its pointer
   * are never touched here, so users keep seeing the published version while
   * the new draft is authored.
   */
  createGuideDraftVersion: (input: CreateGuideDraftVersionInput) =>
    simulateRequest(
      () => {
        const guide = requireGuide(input.guideId);
        const source = currentVersion(guide);
        requireCurrentGuideVersion(input.guideVersionId, source.id);
        // Centralized version-creation policy: no concurrent in-flight version.
        assertCanCreateDraftVersion(guide.id, source);

        const guideVersions = versionsOf(guide.id);
        const now = new Date().toISOString();
        const stagedVersion: GuideVersion = {
          id: `${guide.id}-v${nextDraftVersionNumber(guideVersions)}`,
          guideId: guide.id,
          versionNumber: nextDraftVersionNumber(guideVersions),
          status: INITIAL_VERSION_STATUS,
          // Content carries forward from the version it supersedes.
          contentMarkdown: source.contentMarkdown,
          createdAt: now,
          createdBy: input.actor,
          updatedAt: now,
          updatedBy: input.actor,
          publishedAt: null,
        };
        if (versions.some((version) => version.id === stagedVersion.id)) {
          throw new Error(`GuideVersion ${stagedVersion.id} already exists.`);
        }

        const stagedGuide: Guide = { ...guide, currentVersionId: stagedVersion.id, updatedAt: now };
        const candidateGuides = guides.map((item) => (item.id === guide.id ? stagedGuide : item));
        const candidateVersions = [...versions, stagedVersion];
        validateGuideAssociations(candidateGuides);
        validateGuideVersions(candidateGuides, candidateVersions);

        // ---- commit ----
        versions.push(stagedVersion);
        guide.currentVersionId = stagedVersion.id;
        guide.updatedAt = now;
        activity.push({
          id: nextId(`${guide.id}-activity`),
          guideId: guide.id,
          actor: input.actor,
          action: "New draft version created",
          detail: `Version ${stagedVersion.versionNumber} from v${source.versionNumber}`,
          at: now,
        });

        return clone(withVersion(guide));
      },
      { label: "Guide Versioning API" },
    ),
};
