import { GUIDE_PERMISSIONS, type AuthorizedUser } from "@/domain/permissions";

/**
 * Seeded identities for the prototype. Effective permissions stand in for the
 * permission set that Aurumi RBAC will resolve for the user later.
 */
export const SEEDED_USERS: AuthorizedUser[] = [
  {
    id: "usr-anita-rao",
    name: "Anita Rao",
    baseRole: "Manager",
    permissionProfileLabel: "Authoring + Review Access",
    effectivePermissions: [
      GUIDE_PERMISSIONS.create,
      GUIDE_PERMISSIONS.edit,
      GUIDE_PERMISSIONS.submitForReview,
      GUIDE_PERMISSIONS.review,
      GUIDE_PERMISSIONS.requestChanges,
    ],
  },
  {
    id: "usr-ravi-kumar",
    name: "Ravi Kumar",
    baseRole: "Admin",
    permissionProfileLabel: "Review Access",
    effectivePermissions: [
      GUIDE_PERMISSIONS.create,
      GUIDE_PERMISSIONS.edit,
      GUIDE_PERMISSIONS.submitForReview,
      GUIDE_PERMISSIONS.review,
      GUIDE_PERMISSIONS.approve,
      GUIDE_PERMISSIONS.requestChanges,
    ],
  },
  {
    id: "usr-priya-shah",
    name: "Priya Shah",
    baseRole: "Admin",
    permissionProfileLabel: "Publishing Access",
    effectivePermissions: [
      GUIDE_PERMISSIONS.publish,
      GUIDE_PERMISSIONS.unpublish,
      GUIDE_PERMISSIONS.archive,
    ],
  },
  {
    id: "usr-meera-nair",
    name: "Meera Nair",
    baseRole: "Employee",
    permissionProfileLabel: "Authoring Access",
    effectivePermissions: [
      GUIDE_PERMISSIONS.create,
      GUIDE_PERMISSIONS.edit,
      GUIDE_PERMISSIONS.submitForReview,
    ],
  },
  {
    id: "usr-arjun-bhat",
    name: "Arjun Bhat",
    baseRole: "SuperAdmin",
    permissionProfileLabel: "Full Access",
    effectivePermissions: [GUIDE_PERMISSIONS.admin],
  },
];

export const DEFAULT_USER_ID = SEEDED_USERS[0]!.id;
