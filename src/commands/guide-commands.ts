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

export interface UpdateGuideCommandInput {
  guideId: string;
  title: string;
  summary: string;
  guideType: GuideType;
  actor: string;
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

/** Build 2A.1: Draft metadata update. Requires guide.edit. */
export const updateGuideCommand = defineCommand<UpdateGuideCommandInput, GuideWithVersion>(
  "guide.action.edit",
  (input) => providers.guideStudio.updateGuide(input),
);

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
  updateGuide: updateGuideCommand,
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
