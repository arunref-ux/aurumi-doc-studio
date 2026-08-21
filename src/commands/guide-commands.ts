import type { GuideReferenceTarget } from "@/domain/types";
import { providers } from "@/providers";
import { defineCommand, definePlannedCommand } from "./command-bus";

/**
 * Guide Studio command registry.
 *
 * Each command declares its action key; the command bus maps that key to the
 * required permission centrally, so Build 2 mutations never invent their own
 * authorization logic.
 */

export interface AddGuideAssociationInput {
  guideId: string;
  ref: GuideReferenceTarget;
  label: string;
  parentExternalId?: string;
}

/**
 * Implemented today to prove the boundary end-to-end: authorization is checked
 * in the bus, then the provider validates source/kind and composite uniqueness.
 */
export const addGuideAssociationCommand = defineCommand<AddGuideAssociationInput, unknown>(
  "guide.action.edit",
  (input) => providers.guideStudio.createAssociation(input),
);

/** Build 2 mutations — authorization policy is already centralized. */
export const guideCommands = {
  addAssociation: addGuideAssociationCommand,
  createGuide: definePlannedCommand<{ title: string }>("guide.action.create"),
  editGuide: definePlannedCommand<{ guideId: string }>("guide.action.edit"),
  submitForReview: definePlannedCommand<{ guideId: string }>("guide.action.submit_for_review"),
  review: definePlannedCommand<{ guideId: string }>("guide.action.review"),
  approve: definePlannedCommand<{ guideId: string }>("guide.action.approve"),
  requestChanges: definePlannedCommand<{ guideId: string }>("guide.action.request_changes"),
  publish: definePlannedCommand<{ guideId: string }>("guide.action.publish"),
  unpublish: definePlannedCommand<{ guideId: string }>("guide.action.unpublish"),
  archive: definePlannedCommand<{ guideId: string }>("guide.action.archive"),
} as const;

export type GuideCommandName = keyof typeof guideCommands;
