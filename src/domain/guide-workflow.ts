import type { GuideVersionStatus } from "./types";

/**
 * Build 2B — centralized GuideVersion workflow transition policy.
 *
 * The authoritative workflow state is `GuideVersion.status`. Nothing else may
 * decide whether a transition is legal: routes, components, commands and the
 * provider all consult this module. Guide carries no workflow status.
 *
 * Build 2B lifecycle:
 *
 *   Draft --Submit for Review--> In Review
 *   In Review --Request Changes--> Draft
 *   In Review --Approve--> Approved
 *
 * Publishing / unpublishing / archiving are deliberately NOT part of this
 * build and therefore have no transition entry.
 */

export type GuideWorkflowAction = "submit_for_review" | "request_changes" | "approve";

export const GUIDE_WORKFLOW_ACTION_LABELS: Record<GuideWorkflowAction, string> = {
  submit_for_review: "Submit for Review",
  request_changes: "Request Changes",
  approve: "Approve",
};

/** Past-tense phrasing used by the workflow history feed. */
export const GUIDE_WORKFLOW_EVENT_LABELS: Record<GuideWorkflowAction, string> = {
  submit_for_review: "Submitted for review",
  request_changes: "Changes requested",
  approve: "Approved",
};

/**
 * The single transition table. `from status -> action -> to status`.
 * Any pair absent from this table is rejected.
 */
const TRANSITIONS: Partial<
  Record<GuideVersionStatus, Partial<Record<GuideWorkflowAction, GuideVersionStatus>>>
> = {
  draft: { submit_for_review: "in-review" },
  "in-review": { request_changes: "draft", approve: "approved" },
  // approved / published / archived intentionally have no Build 2B transitions.
};

export class InvalidGuideVersionTransitionError extends Error {
  constructor(
    public readonly fromStatus: GuideVersionStatus,
    public readonly action: GuideWorkflowAction,
  ) {
    super(
      `"${GUIDE_WORKFLOW_ACTION_LABELS[action]}" is not a valid transition from status "${fromStatus}".`,
    );
    this.name = "InvalidGuideVersionTransitionError";
  }
}

/** Resolves the resulting status, or null when the transition is not allowed. */
export function canTransitionGuideVersion(
  fromStatus: GuideVersionStatus,
  action: GuideWorkflowAction,
): GuideVersionStatus | null {
  return TRANSITIONS[fromStatus]?.[action] ?? null;
}

/** Domain guard used at the provider mutation boundary. */
export function resolveGuideVersionTransition(
  fromStatus: GuideVersionStatus,
  action: GuideWorkflowAction,
): GuideVersionStatus {
  const next = canTransitionGuideVersion(fromStatus, action);
  if (!next) throw new InvalidGuideVersionTransitionError(fromStatus, action);
  return next;
}

/** Available workflow actions for a status, in display order. */
export function availableWorkflowActions(fromStatus: GuideVersionStatus): GuideWorkflowAction[] {
  return (Object.keys(GUIDE_WORKFLOW_ACTION_LABELS) as GuideWorkflowAction[]).filter(
    (action) => canTransitionGuideVersion(fromStatus, action) !== null,
  );
}

export class StaleGuideVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaleGuideVersionError";
  }
}

/**
 * Strict version identity rule (Build 2B hardening): a workflow command must
 * supply an explicit, non-blank GuideVersion ID that exactly equals the guide's
 * current version ID. No truthiness fallback, no implicit "current version".
 */
export function requireCurrentGuideVersion(
  suppliedVersionId: string | null | undefined,
  currentVersionId: string,
): string {
  if (typeof suppliedVersionId !== "string" || suppliedVersionId.trim().length === 0) {
    throw new StaleGuideVersionError(
      "A workflow action requires an explicit guideVersionId identifying the current version.",
    );
  }
  if (suppliedVersionId !== currentVersionId) {
    throw new StaleGuideVersionError(
      `Version ${suppliedVersionId} is not the current version (${currentVersionId}); reload the guide and retry.`,
    );
  }
  return suppliedVersionId;
}

/** Minimal version-level audit record. Not a comment system. */
export interface GuideVersionWorkflowEvent {
  id: string;
  guideId: string;
  guideVersionId: string;
  action: GuideWorkflowAction;
  fromStatus: GuideVersionStatus;
  toStatus: GuideVersionStatus;
  performedAt: string;
  performedBy: string;
  note?: string;
}
