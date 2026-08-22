/**
 * Guide Studio permission catalog.
 *
 * Guide Studio authorizes actions through fine-grained permissions only.
 * It never checks workflow labels (Editor / Reviewer / Publisher) and never
 * branches on the Aurumi global base role.
 *
 * Aurumi RBAC (Employee | Manager | Admin | SuperAdmin)
 *   -> Effective Permissions
 *   -> Guide Studio Action Authorization
 */

export const GUIDE_PERMISSIONS = {
  create: "guide.create",
  edit: "guide.edit",
  submitForReview: "guide.submit_review",
  review: "guide.review",
  approve: "guide.approve",
  requestChanges: "guide.request_changes",
  publish: "guide.publish",
  unpublish: "guide.unpublish",
  archive: "guide.archive",
  admin: "guide.admin",
} as const;

export type GuidePermission = (typeof GUIDE_PERMISSIONS)[keyof typeof GUIDE_PERMISSIONS];

/** Permission that bypasses every Guide Studio action check. */
export const GUIDE_ADMIN_PERMISSION: GuidePermission = GUIDE_PERMISSIONS.admin;

export type PermissionGroupKey = "authoring" | "review" | "publishing" | "administration";

export interface PermissionDefinition {
  permission: GuidePermission;
  label: string;
  description: string;
  group: PermissionGroupKey;
}

export const PERMISSION_GROUP_LABELS: Record<PermissionGroupKey, string> = {
  authoring: "Authoring",
  review: "Review",
  publishing: "Publishing",
  administration: "Administration / Override",
};

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  {
    permission: GUIDE_PERMISSIONS.create,
    label: "Create guide",
    description: "Create new guide records in Guide Studio.",
    group: "authoring",
  },
  {
    permission: GUIDE_PERMISSIONS.edit,
    label: "Edit guide",
    description: "Edit guide metadata, associations and content.",
    group: "authoring",
  },
  {
    permission: GUIDE_PERMISSIONS.submitForReview,
    label: "Submit for review",
    description: "Move a draft guide into the review lifecycle.",
    group: "authoring",
  },
  {
    permission: GUIDE_PERMISSIONS.review,
    label: "Review guide",
    description: "Open review workspaces and record review comments.",
    group: "review",
  },
  {
    permission: GUIDE_PERMISSIONS.approve,
    label: "Approve guide",
    description: "Approve a reviewed guide for publication.",
    group: "review",
  },
  {
    permission: GUIDE_PERMISSIONS.requestChanges,
    label: "Request changes",
    description: "Send a guide back to the author with change requests.",
    group: "review",
  },
  {
    permission: GUIDE_PERMISSIONS.publish,
    label: "Publish guide",
    description: "Publish an approved guide to the Help experience.",
    group: "publishing",
  },
  {
    permission: GUIDE_PERMISSIONS.unpublish,
    label: "Unpublish guide",
    description: "Withdraw a published guide from the Help experience.",
    group: "publishing",
  },
  {
    permission: GUIDE_PERMISSIONS.archive,
    label: "Archive guide",
    description: "Archive a guide that is no longer maintained.",
    group: "publishing",
  },
  {
    permission: GUIDE_ADMIN_PERMISSION,
    label: "Guide administration",
    description: "Full override for every Guide Studio action.",
    group: "administration",
  },
];

export const PERMISSION_LABELS: Record<GuidePermission, string> = PERMISSION_CATALOG.reduce(
  (acc, def) => {
    acc[def.permission] = def.label;
    return acc;
  },
  {} as Record<GuidePermission, string>,
);

/* ------------------------------------------------------------------ */
/* Workflow action definitions                                         */
/* ------------------------------------------------------------------ */

export type GuideActionKey =
  | "guide.action.create"
  | "guide.action.edit"
  | "guide.action.submit_for_review"
  | "guide.action.review"
  | "guide.action.approve"
  | "guide.action.request_changes"
  | "guide.action.publish"
  | "guide.action.unpublish"
  | "guide.action.archive";

export interface GuideActionDefinition {
  key: GuideActionKey;
  label: string;
  /** Permissions required for this action (any-of). */
  requires: GuidePermission[];
  /** Build in which the action becomes functional. */
  availableInBuild: 1 | 2;
}

export const GUIDE_ACTIONS: Record<GuideActionKey, GuideActionDefinition> = {
  "guide.action.create": {
    key: "guide.action.create",
    label: "Create Guide",
    requires: [GUIDE_PERMISSIONS.create],
    availableInBuild: 2,
  },
  "guide.action.edit": {
    key: "guide.action.edit",
    label: "Edit Guide",
    requires: [GUIDE_PERMISSIONS.edit],
    availableInBuild: 2,
  },
  "guide.action.submit_for_review": {
    key: "guide.action.submit_for_review",
    label: "Submit for Review",
    requires: [GUIDE_PERMISSIONS.submitForReview],
    availableInBuild: 2,
  },
  "guide.action.review": {
    key: "guide.action.review",
    label: "Open Review",
    requires: [GUIDE_PERMISSIONS.review],
    availableInBuild: 2,
  },
  "guide.action.approve": {
    key: "guide.action.approve",
    label: "Approve",
    requires: [GUIDE_PERMISSIONS.approve],
    availableInBuild: 2,
  },
  "guide.action.request_changes": {
    key: "guide.action.request_changes",
    label: "Request Changes",
    // Build 2B mapping: Request Changes is a reviewer capability.
    requires: [GUIDE_PERMISSIONS.review, GUIDE_PERMISSIONS.requestChanges],
    availableInBuild: 2,
  },
  "guide.action.publish": {
    key: "guide.action.publish",
    label: "Publish",
    requires: [GUIDE_PERMISSIONS.publish],
    availableInBuild: 2,
  },
  "guide.action.unpublish": {
    key: "guide.action.unpublish",
    label: "Unpublish",
    requires: [GUIDE_PERMISSIONS.unpublish],
    availableInBuild: 2,
  },
  "guide.action.archive": {
    key: "guide.action.archive",
    label: "Archive",
    requires: [GUIDE_PERMISSIONS.archive],
    availableInBuild: 2,
  },
};

/* ------------------------------------------------------------------ */
/* Identity supplied by Aurumi RBAC                                    */
/* ------------------------------------------------------------------ */

/** The four global Aurumi roles. Guide Studio never authorizes on these. */
export type AurumiBaseRole = "Employee" | "Manager" | "Admin" | "SuperAdmin";

export interface AuthorizedUser {
  id: string;
  name: string;
  baseRole: AurumiBaseRole;
  effectivePermissions: GuidePermission[];
  /** Descriptive label for the simulated permission profile (not an RBAC role). */
  permissionProfileLabel: string;
}
