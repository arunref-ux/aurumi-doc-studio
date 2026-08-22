import type { GuideType, GuideWithVersion, GuideReferenceTarget } from "@/domain/types";
import { providers } from "@/providers";
import { defineCommand, definePlannedCommand } from "./command-bus";

/**
 * Guide Studio command registry.
 *
 * Each command declares its action key; the command bus maps that key to the
 * required permission centrally, so mutations never invent their own
 * authorization logic.
 */

export interface AssociationDraftInput {
  ref: GuideReferenceTarget;
  label: string;
  parentExternalId?: string;
}

export interface CreateGuideCommandInput {
  title: string;
  summary: string;
  guideType: GuideType;
  actor: string;
  associations?: AssociationDraftInput[];
}

/**
 * Build 2A.1 editable contract: title, summary and the complete association
 * set. `guideType` is deliberately NOT accepted — it cannot be changed through
 * the guide update path in this build.
 */
export interface UpdateGuideDraftCommandInput {
  guideId: string;
  title: string;
  summary: string;
  /** Canonical Markdown for the current GuideVersion (Build 2A.2). */
  contentMarkdown: string;
  actor: string;
  associations: AssociationDraftInput[];
}

/**
 * Build 2B workflow command input. Callers never pass a status — the target
 * status is resolved by the centralized lifecycle policy in the provider.
 */
export interface GuideWorkflowCommandInput {
  guideId: string;
  guideVersionId: string;
  actor: string;
  note?: string;
}

export interface AddGuideAssociationInput {
  guideId: string;
  ref: GuideReferenceTarget;
  label: string;
  parentExternalId?: string;
}

export interface RemoveGuideAssociationInput {
  guideId: string;
  ref: GuideReferenceTarget;
}

/**
 * Build 2A.1: Guide creation. Authorization (guide.create) is enforced in the
 * bus; the provider then creates the Guide and its initial GuideVersion
 * (1.0 / Draft) as one atomic operation.
 */
export const createGuideCommand = defineCommand<CreateGuideCommandInput, GuideWithVersion>(
  "guide.action.create",
  (input) => providers.guideStudio.createGuide(input),
);

/**
 * Build 2A.1: the single logical draft update (metadata + associations).
 * Requires guide.edit; the provider validates the whole edit before committing.
 */
export const updateGuideDraftCommand = defineCommand<
  UpdateGuideDraftCommandInput,
  GuideWithVersion
>("guide.action.edit", (input) => providers.guideStudio.updateGuideDraft(input));

/**
 * Authorization is checked in the bus, then the provider validates
 * source/kind and composite uniqueness.
 */
export const addGuideAssociationCommand = defineCommand<AddGuideAssociationInput, unknown>(
  "guide.action.edit",
  (input) => providers.guideStudio.createAssociation(input),
);

export const removeGuideAssociationCommand = defineCommand<RemoveGuideAssociationInput, void>(
  "guide.action.edit",
  (input) => providers.guideStudio.removeAssociation(input),
);

/* ------------------------------------------------------------------ */
/* Build 2B — review & approval workflow commands                      */
/* ------------------------------------------------------------------ */

export const submitGuideForReviewCommand = defineCommand<
  GuideWorkflowCommandInput,
  GuideWithVersion
>("guide.action.submit_for_review", (input) =>
  providers.guideStudio.submitGuideVersionForReview(input),
);

export const requestGuideChangesCommand = defineCommand<
  GuideWorkflowCommandInput,
  GuideWithVersion
>("guide.action.request_changes", (input) =>
  providers.guideStudio.requestGuideVersionChanges(input),
);

export const approveGuideVersionCommand = defineCommand<
  GuideWorkflowCommandInput,
  GuideWithVersion
>("guide.action.approve", (input) => providers.guideStudio.approveGuideVersion(input));

/* ------------------------------------------------------------------ */
/* Build 2C — publishing & version lifecycle commands                  */
/* ------------------------------------------------------------------ */

/**
 * Publishing an Approved version. The provider re-validates the lifecycle
 * transition and archives the previously published version atomically.
 */
export const publishGuideVersionCommand = defineCommand<
  GuideWorkflowCommandInput,
  GuideWithVersion
>("guide.action.publish", (input) => providers.guideStudio.publishGuideVersion(input));

export interface CreateGuideDraftVersionCommandInput {
  guideId: string;
  guideVersionId: string;
  actor: string;
}

/** Creating the next Draft version of an existing Guide. */
export const createGuideDraftVersionCommand = defineCommand<
  CreateGuideDraftVersionCommandInput,
  GuideWithVersion
>("guide.action.create_version", (input) =>
  providers.guideStudio.createGuideDraftVersion(input),
);

/** Later-build lifecycle mutations — authorization policy already centralized. */
export const guideCommands = {
  createGuide: createGuideCommand,
  updateGuideDraft: updateGuideDraftCommand,
  addAssociation: addGuideAssociationCommand,
  removeAssociation: removeGuideAssociationCommand,
  submitForReview: submitGuideForReviewCommand,
  review: definePlannedCommand<{ guideId: string }>("guide.action.review"),
  approve: approveGuideVersionCommand,
  requestChanges: requestGuideChangesCommand,
  publish: publishGuideVersionCommand,
  createDraftVersion: createGuideDraftVersionCommand,
  unpublish: definePlannedCommand<{ guideId: string }>("guide.action.unpublish"),
  archive: definePlannedCommand<{ guideId: string }>("guide.action.archive"),
} as const;

export type GuideCommandName = keyof typeof guideCommands;
