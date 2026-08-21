import { guideRef } from "@/domain/external-ref";
import type {
  Guide,
  GuideActivityEntry,
  GuideAssociation,
  GuideReferenceTarget,
  GuideType,
  GuideVersion,
  GuideVersionStatus,
} from "@/domain/types";

type AssocSpec = Omit<GuideAssociation, "id" | "guideId">;

interface GuideSeed {
  id: string;
  title: string;
  summary: string;
  guideType: GuideType;
  /** Seeded lifecycle state of the guide's current version. */
  status: GuideVersionStatus;
  currentVersion: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  associations: AssocSpec[];
}

/** Validated at construction time — no unsafe type assertions. */
const ref = (source: string, kind: string, externalId: string): GuideReferenceTarget =>
  guideRef(source, kind, externalId);

const app = (externalId: string, label: string): AssocSpec => ({
  ref: ref("devharmony", "app", externalId),
  label,
});
const feature = (externalId: string, label: string, parentExternalId: string): AssocSpec => ({
  ref: ref("devharmony", "feature", externalId),
  label,
  parentExternalId,
});
const topic = (externalId: string, label: string): AssocSpec => ({
  ref: ref("ai-studio", "topic", externalId),
  label,
});
const intent = (externalId: string, label: string, parentExternalId: string): AssocSpec => ({
  ref: ref("ai-studio", "intent", externalId),
  label,
  parentExternalId,
});
const connector = (externalId: string, label: string): AssocSpec => ({
  ref: ref("connector", "connector", externalId),
  label,
});
const capability = (externalId: string, label: string, parentExternalId: string): AssocSpec => ({
  ref: ref("connector", "capability", externalId),
  label,
  parentExternalId,
});
const related = (externalId: string, label: string): AssocSpec => ({
  ref: ref("guide-studio", "related-guide", externalId),
  label,
});

const seeds: GuideSeed[] = [
  {
    id: "guide-create-deal",
    title: "How to Create a Deal",
    summary:
      "Step-by-step instructions for creating a deal in a pipeline, including required fields, owner assignment and expected close date.",
    guideType: "how-to",
    status: "published",
    currentVersion: "1.1",
    owner: "Priya Raghavan",
    createdAt: "2025-03-12T09:15:00Z",
    updatedAt: "2026-08-11T11:20:00Z",
    publishedAt: "2026-08-11T12:00:00Z",
    associations: [
      app("app-deals", "Deals"),
      feature("feature-create-deal", "Create Deal", "app-deals"),
      topic("topic-deals", "Deals"),
      intent("intent-create-deal", "Create Deal", "topic-deals"),
      related("guide-edit-deal", "How to Edit a Deal"),
      related("guide-change-deal-stage", "How to Change a Deal Stage"),
    ],
  },
  {
    id: "guide-edit-deal",
    title: "How to Edit a Deal",
    summary:
      "How to update deal details such as value, contact, expected close date and custom fields, and which fields are locked after a deal closes.",
    guideType: "how-to",
    status: "published",
    currentVersion: "1.0",
    owner: "Priya Raghavan",
    createdAt: "2025-03-18T10:00:00Z",
    updatedAt: "2026-07-29T08:45:00Z",
    publishedAt: "2026-07-29T09:30:00Z",
    associations: [
      app("app-deals", "Deals"),
      feature("feature-edit-deal", "Edit Deal", "app-deals"),
      topic("topic-deals", "Deals"),
      intent("intent-edit-deal", "Edit Deal", "topic-deals"),
      related("guide-why-cant-i-edit-a-deal", "Why Can't I Edit a Deal?"),
    ],
  },
  {
    id: "guide-change-deal-stage",
    title: "How to Change a Deal Stage",
    summary:
      "Moving a deal through pipeline stages, stage entry requirements, and how stage automation affects forecasting.",
    guideType: "how-to",
    status: "published",
    currentVersion: "2.0",
    owner: "Daniel Okafor",
    createdAt: "2025-04-02T13:30:00Z",
    updatedAt: "2026-08-14T15:10:00Z",
    publishedAt: "2026-08-15T07:00:00Z",
    associations: [
      app("app-deals", "Deals"),
      feature("feature-update-deal-stage", "Update Deal Stage", "app-deals"),
      topic("topic-deals", "Deals"),
      intent("intent-how-do-i-change-a-deal-stage", "How Do I Change a Deal Stage?", "topic-deals"),
    ],
  },
  {
    id: "guide-why-cant-i-edit-a-deal",
    title: "Why Can't I Edit a Deal?",
    summary:
      "Diagnoses the common reasons deal editing is blocked: insufficient role permissions, closed-won/closed-lost lock, record ownership and approval holds.",
    guideType: "troubleshooting",
    status: "published",
    currentVersion: "1.2",
    owner: "Daniel Okafor",
    createdAt: "2025-05-06T09:00:00Z",
    updatedAt: "2026-08-05T16:40:00Z",
    publishedAt: "2026-08-06T06:20:00Z",
    associations: [
      app("app-deals", "Deals"),
      feature("feature-edit-deal", "Edit Deal", "app-deals"),
      topic("topic-deals", "Deals"),
      intent("intent-why-cant-i-edit-a-deal", "Why Can't I Edit a Deal?", "topic-deals"),
      related("guide-role-based-access", "Understanding Role-Based Access"),
    ],
  },
  {
    id: "guide-create-employee",
    title: "How to Create an Employee",
    summary:
      "Creating an employee record with employment details, reporting manager, work location and payroll identifiers.",
    guideType: "how-to",
    status: "published",
    currentVersion: "1.0",
    owner: "Meera Shah",
    createdAt: "2025-06-11T11:05:00Z",
    updatedAt: "2026-06-24T10:15:00Z",
    publishedAt: "2026-06-24T11:00:00Z",
    associations: [
      app("app-employee-management", "Employee Management"),
      feature("feature-create-employee", "Create Employee", "app-employee-management"),
      topic("topic-employee-management", "Employee Management"),
      intent("intent-add-employee", "Add Employee", "topic-employee-management"),
    ],
  },
  {
    id: "guide-invite-employee",
    title: "How to Invite an Employee",
    summary:
      "Sending workspace invitations, resending expired invites and choosing the initial role for a new employee.",
    guideType: "how-to",
    status: "in-review",
    currentVersion: "0.4",
    owner: "Meera Shah",
    createdAt: "2026-07-02T09:40:00Z",
    updatedAt: "2026-08-18T13:25:00Z",
    publishedAt: null,
    associations: [
      app("app-employee-management", "Employee Management"),
      feature("feature-invite-employee", "Invite Employee", "app-employee-management"),
      topic("topic-employee-management", "Employee Management"),
      intent("intent-invite-employee", "Invite Employee", "topic-employee-management"),
    ],
  },
  {
    id: "guide-managing-employee-roles",
    title: "Managing Employee Roles",
    summary:
      "Administration guide for assigning roles and permission sets, including least-privilege recommendations for HR and finance teams.",
    guideType: "administration",
    status: "draft",
    currentVersion: "0.2",
    owner: "Arun Balakrishnan",
    createdAt: "2026-05-14T08:10:00Z",
    updatedAt: "2026-05-29T14:05:00Z",
    publishedAt: null,
    associations: [
      app("app-employee-management", "Employee Management"),
      feature("feature-manage-employee-roles", "Manage Employee Roles", "app-employee-management"),
      topic("topic-employee-management", "Employee Management"),
      intent("intent-change-employee-role", "Change Employee Role", "topic-employee-management"),
      related("guide-role-based-access", "Understanding Role-Based Access"),
    ],
  },
  {
    id: "guide-configure-attendance",
    title: "How to Configure Attendance",
    summary:
      "Configuring attendance capture modes, shift patterns, grace periods and geofencing for field teams.",
    guideType: "configuration",
    status: "published",
    currentVersion: "1.3",
    owner: "Arun Balakrishnan",
    createdAt: "2025-08-20T07:50:00Z",
    updatedAt: "2026-07-16T09:35:00Z",
    publishedAt: "2026-07-16T10:10:00Z",
    associations: [
      app("app-attendance-leave", "Attendance & Leave"),
      feature("feature-configure-attendance", "Configure Attendance", "app-attendance-leave"),
    ],
  },
  {
    id: "guide-configure-leave-policies",
    title: "How to Configure Leave Policies",
    summary:
      "Creating leave types, accrual rules, carry-forward limits and approval chains for each employee group.",
    guideType: "configuration",
    status: "draft",
    currentVersion: "0.5",
    owner: "Lisa Fernandes",
    createdAt: "2026-03-09T12:20:00Z",
    updatedAt: "2026-04-21T15:45:00Z",
    publishedAt: null,
    associations: [
      app("app-attendance-leave", "Attendance & Leave"),
      feature("feature-configure-leave-policies", "Configure Leave Policies", "app-attendance-leave"),
    ],
  },
  {
    id: "guide-connect-zoho-books",
    title: "How to Connect Zoho Books",
    summary:
      "Connecting Aurumi to Zoho Books: prerequisites, required Zoho scopes, organisation selection and validating the first sync.",
    guideType: "connector-guide",
    status: "published",
    currentVersion: "1.2",
    owner: "Tomas Novak",
    createdAt: "2025-09-01T10:30:00Z",
    updatedAt: "2026-08-19T07:15:00Z",
    publishedAt: "2026-08-19T08:00:00Z",
    associations: [
      connector("connector-zoho-books", "Zoho Books"),
      capability("capability-connect-zoho-books", "Connect Zoho Books", "connector-zoho-books"),
      capability("capability-authenticate-account", "Authenticate Account", "connector-zoho-books"),
      topic("topic-connectors", "Connectors"),
      intent("intent-connect-zoho-books", "Connect Zoho Books", "topic-connectors"),
    ],
  },
  {
    id: "guide-troubleshoot-zoho-authentication",
    title: "Troubleshoot Zoho Authentication",
    summary:
      "Resolving Zoho Books authentication failures caused by expired refresh tokens, revoked scopes, region mismatch or multi-org selection.",
    guideType: "troubleshooting",
    status: "published",
    currentVersion: "1.0",
    owner: "Tomas Novak",
    createdAt: "2025-11-19T09:05:00Z",
    updatedAt: "2026-08-01T12:30:00Z",
    publishedAt: "2026-08-02T06:45:00Z",
    associations: [
      connector("connector-zoho-books", "Zoho Books"),
      capability("capability-authenticate-account", "Authenticate Account", "connector-zoho-books"),
      topic("topic-connectors", "Connectors"),
      intent("intent-zoho-authentication-failed", "Zoho Authentication Failed", "topic-connectors"),
      related("guide-connect-zoho-books", "How to Connect Zoho Books"),
    ],
  },
  {
    id: "guide-troubleshoot-invoice-sync",
    title: "Troubleshoot Invoice Synchronisation",
    summary:
      "Why invoices fail to synchronise with Zoho Books: mapping gaps, tax configuration mismatches, currency rules and retry behaviour.",
    guideType: "troubleshooting",
    status: "in-review",
    currentVersion: "0.9",
    owner: "Sofia Marino",
    createdAt: "2026-06-05T14:00:00Z",
    updatedAt: "2026-08-20T09:50:00Z",
    publishedAt: null,
    associations: [
      connector("connector-zoho-books", "Zoho Books"),
      capability(
        "capability-configure-invoice-synchronisation",
        "Configure Invoice Synchronisation",
        "connector-zoho-books",
      ),
      topic("topic-connectors", "Connectors"),
      intent("intent-invoice-synchronisation-failed", "Invoice Synchronisation Failed", "topic-connectors"),
    ],
  },
  {
    id: "guide-connect-whatsapp-business",
    title: "How to Connect WhatsApp Business",
    summary:
      "Linking a WhatsApp Business account, verifying the business number and setting message sync boundaries.",
    guideType: "connector-guide",
    status: "approved",
    currentVersion: "1.0",
    owner: "Sofia Marino",
    createdAt: "2026-04-28T08:20:00Z",
    updatedAt: "2026-08-12T10:05:00Z",
    publishedAt: null,
    associations: [
      connector("connector-whatsapp-business", "WhatsApp Business"),
      capability(
        "capability-connect-whatsapp-account",
        "Connect WhatsApp Account",
        "connector-whatsapp-business",
      ),
      capability(
        "capability-configure-business-number",
        "Configure Business Number",
        "connector-whatsapp-business",
      ),
    ],
  },
  {
    id: "guide-role-based-access",
    title: "Understanding Role-Based Access",
    summary:
      "Concept guide explaining Aurumi roles, permission sets, record ownership and how access decisions are evaluated across micro apps.",
    guideType: "concept",
    status: "published",
    currentVersion: "2.1",
    owner: "Arun Balakrishnan",
    createdAt: "2025-02-02T10:00:00Z",
    updatedAt: "2026-07-08T13:15:00Z",
    publishedAt: "2026-07-09T07:20:00Z",
    associations: [
      app("app-employee-management", "Employee Management"),
      topic("topic-employee-management", "Employee Management"),
      intent(
        "intent-why-cant-i-access-employee-management",
        "Why Can't I Access Employee Management?",
        "topic-employee-management",
      ),
    ],
  },
  {
    id: "guide-product-navigation-basics",
    title: "Aurumi Product Navigation Basics",
    summary:
      "Orientation guide covering the Aurumi app switcher, global search, workspace context and where micro app settings live.",
    guideType: "concept",
    status: "published",
    currentVersion: "1.4",
    owner: "Lisa Fernandes",
    createdAt: "2025-01-15T09:00:00Z",
    updatedAt: "2026-05-30T11:40:00Z",
    publishedAt: "2026-05-30T12:20:00Z",
    associations: [],
  },
  {
    id: "guide-deal-data-retention-policy",
    title: "Deal Data Retention Policy",
    summary:
      "Reference for how long deal records, attachments and activity history are retained, and what deletion means for reporting.",
    guideType: "policy-reference",
    status: "archived",
    currentVersion: "1.0",
    owner: "Priya Raghavan",
    createdAt: "2024-11-11T08:00:00Z",
    updatedAt: "2026-02-18T10:30:00Z",
    publishedAt: "2025-01-06T09:00:00Z",
    associations: [
      app("app-deals", "Deals"),
      feature("feature-delete-deal", "Delete Deal", "app-deals"),
    ],
  },
];

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const seedGuideVersions: GuideVersion[] = seeds.map((seed) => ({
  id: `${seed.id}-v${seed.currentVersion}`,
  guideId: seed.id,
  versionNumber: seed.currentVersion,
  status: seed.status,
  createdAt: seed.createdAt,
  createdBy: seed.owner,
  updatedAt: seed.updatedAt,
  updatedBy: seed.owner,
  publishedAt: seed.publishedAt ?? null,
}));

export const seedGuides: Guide[] = seeds.map((seed) => ({
  id: seed.id,
  title: seed.title,
  slug: slugify(seed.title),
  summary: seed.summary,
  guideType: seed.guideType,
  currentVersionId: `${seed.id}-v${seed.currentVersion}`,
  owner: seed.owner,
  createdAt: seed.createdAt,
  updatedAt: seed.updatedAt,
  associations: seed.associations.map((assoc, index) => ({
    ...assoc,
    id: `${seed.id}-assoc-${index + 1}`,
    guideId: seed.id,
  })),
}));

export const seedActivity: GuideActivityEntry[] = [
  a("guide-troubleshoot-invoice-sync", "Sofia Marino", "Submitted for review", "Version 0.9", "2026-08-20T09:50:00Z"),
  a("guide-invite-employee", "Meera Shah", "Review comment added", "Clarify invite expiry window", "2026-08-18T13:25:00Z"),
  a("guide-connect-zoho-books", "Tomas Novak", "Published", "Version 1.2", "2026-08-19T08:00:00Z"),
  a("guide-change-deal-stage", "Daniel Okafor", "Published", "Aligned to Update Deal Stage v2.0", "2026-08-15T07:00:00Z"),
  a("guide-connect-whatsapp-business", "Arun Balakrishnan", "Approved", "Awaiting publish window", "2026-08-12T10:05:00Z"),
  a("guide-create-deal", "Priya Raghavan", "Published", "Version 1.1", "2026-08-11T12:00:00Z"),
  a("guide-why-cant-i-edit-a-deal", "Daniel Okafor", "Updated content", "Added approval hold scenario", "2026-08-05T16:40:00Z"),
  a("guide-troubleshoot-zoho-authentication", "Tomas Novak", "Published", "Region mismatch section added", "2026-08-02T06:45:00Z"),
  a("guide-edit-deal", "Priya Raghavan", "Published", "Version 1.0", "2026-07-29T09:30:00Z"),
  a("guide-configure-attendance", "Arun Balakrishnan", "Published", "Version 1.3", "2026-07-16T10:10:00Z"),
  a("guide-role-based-access", "Arun Balakrishnan", "Published", "Version 2.1", "2026-07-09T07:20:00Z"),
  a("guide-create-employee", "Meera Shah", "Published", "Version 1.0", "2026-06-24T11:00:00Z"),
  a("guide-product-navigation-basics", "Lisa Fernandes", "Published", "Version 1.4", "2026-05-30T12:20:00Z"),
  a("guide-managing-employee-roles", "Arun Balakrishnan", "Draft saved", "Outline only", "2026-05-29T14:05:00Z"),
  a("guide-configure-leave-policies", "Lisa Fernandes", "Draft saved", "Accrual section pending", "2026-04-21T15:45:00Z"),
  a("guide-deal-data-retention-policy", "Priya Raghavan", "Archived", "Superseded by platform policy", "2026-02-18T10:30:00Z"),
];

function a(
  guideId: string,
  actor: string,
  action: string,
  detail: string,
  at: string,
): GuideActivityEntry {
  return { id: `${guideId}-${at}`, guideId, actor, action, detail, at };
}
