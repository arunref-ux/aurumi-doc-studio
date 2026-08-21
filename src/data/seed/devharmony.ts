import type { AppRef, FeatureRef, FeatureVersionRef } from "@/domain/types";

export const devHarmonyApps: AppRef[] = [
  {
    source: "devharmony",
    externalId: "app-deals",
    name: "Deals",
    description: "Pipeline, deal records, stages and revenue tracking.",
    featureCount: 6,
  },
  {
    source: "devharmony",
    externalId: "app-employee-management",
    name: "Employee Management",
    description: "Employee records, invitations, roles and lifecycle.",
    featureCount: 5,
  },
  {
    source: "devharmony",
    externalId: "app-attendance-leave",
    name: "Attendance & Leave",
    description: "Attendance capture, leave policies, approvals and reports.",
    featureCount: 5,
  },
];

export const devHarmonyFeatures: FeatureRef[] = [
  // Deals
  f("feature-create-deal", "app-deals", "Create Deal", "Create a new deal record in a pipeline.", "1.1"),
  f("feature-edit-deal", "app-deals", "Edit Deal", "Update fields on an existing deal.", "1.0"),
  f(
    "feature-update-deal-stage",
    "app-deals",
    "Update Deal Stage",
    "Move a deal between pipeline stages.",
    "2.0",
  ),
  f("feature-delete-deal", "app-deals", "Delete Deal", "Permanently remove a deal record.", "1.0"),
  f(
    "feature-merge-duplicate-deals",
    "app-deals",
    "Merge Duplicate Deals",
    "Merge duplicate deal records and retain history.",
    "1.0",
  ),
  f("feature-export-deals", "app-deals", "Export Deals", "Export deal data to CSV or XLSX.", "1.0"),

  // Employee Management
  f(
    "feature-create-employee",
    "app-employee-management",
    "Create Employee",
    "Add a new employee record.",
    "1.0",
  ),
  f(
    "feature-invite-employee",
    "app-employee-management",
    "Invite Employee",
    "Send a workspace invitation to an employee.",
    "1.0",
  ),
  f(
    "feature-edit-employee",
    "app-employee-management",
    "Edit Employee",
    "Update employee profile and employment details.",
    "1.0",
  ),
  f(
    "feature-manage-employee-roles",
    "app-employee-management",
    "Manage Employee Roles",
    "Assign roles and permission sets to employees.",
    "1.0",
  ),
  f(
    "feature-deactivate-employee",
    "app-employee-management",
    "Deactivate Employee",
    "Offboard an employee and revoke access.",
    "1.0",
  ),

  // Attendance & Leave
  f(
    "feature-configure-attendance",
    "app-attendance-leave",
    "Configure Attendance",
    "Define attendance capture rules and shifts.",
    "1.0",
  ),
  f(
    "feature-configure-leave-policies",
    "app-attendance-leave",
    "Configure Leave Policies",
    "Create leave types, accruals and entitlements.",
    "1.0",
  ),
  f(
    "feature-apply-for-leave",
    "app-attendance-leave",
    "Apply for Leave",
    "Submit a leave request for approval.",
    "1.0",
  ),
  f(
    "feature-approve-leave",
    "app-attendance-leave",
    "Approve Leave",
    "Review and action pending leave requests.",
    "1.0",
  ),
  f(
    "feature-view-attendance-reports",
    "app-attendance-leave",
    "View Attendance Reports",
    "Analyse attendance and absence trends.",
    "1.0",
  ),
];

export const devHarmonyFeatureVersions: FeatureVersionRef[] = [
  v("feature-create-deal", "1.0", "2025-02-11", "deprecated"),
  v("feature-create-deal", "1.1", "2025-09-30", "current"),
  v("feature-update-deal-stage", "1.0", "2025-01-20", "deprecated"),
  v("feature-update-deal-stage", "2.0", "2026-01-15", "current"),
  ...devHarmonyFeatures
    .filter((feat) => !["feature-create-deal", "feature-update-deal-stage"].includes(feat.externalId))
    .map((feat) => v(feat.externalId, "1.0", "2025-03-04", "current" as const)),
];

function f(
  externalId: string,
  appExternalId: string,
  name: string,
  description: string,
  latestVersion: string,
): FeatureRef {
  return { source: "devharmony", externalId, appExternalId, name, description, latestVersion };
}

function v(
  featureExternalId: string,
  version: string,
  releasedAt: string,
  status: "current" | "deprecated",
): FeatureVersionRef {
  return {
    source: "devharmony",
    externalId: `${featureExternalId}-v${version}`,
    featureExternalId,
    version,
    releasedAt,
    status,
  };
}
