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
  actor: string;
  associations: AssociationDraftInput[];
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

/** Later-build lifecycle mutations — authorization policy already centralized. */
export const guideCommands = {
  createGuide: createGuideCommand,
  updateGuideDraft: updateGuideDraftCommand,
  addAssociation: addGuideAssociationCommand,
  removeAssociation: removeGuideAssociationCommand,
  submitForReview: definePlannedCommand<{ guideId: string }>("guide.action.submit_for_review"),
  review: definePlannedCommand<{ guideId: string }>("guide.action.review"),
  approve: definePlannedCommand<{ guideId: string }>("guide.action.approve"),
  requestChanges: definePlannedCommand<{ guideId: string }>("guide.action.request_changes"),
  publish: definePlannedCommand<{ guideId: string }>("guide.action.publish"),
  unpublish: definePlannedCommand<{ guideId: string }>("guide.action.unpublish"),
  archive: definePlannedCommand<{ guideId: string }>("guide.action.archive"),
} as const;

export type GuideCommandName = keyof typeof guideCommands;
