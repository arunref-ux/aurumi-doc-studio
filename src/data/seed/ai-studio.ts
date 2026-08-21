import type { IntentRef, TopicRef } from "@/domain/types";

export const aiTopics: TopicRef[] = [
  {
    source: "ai-studio",
    externalId: "topic-deals",
    name: "Deals",
    description: "Conversational intents covering deal creation, editing and stages.",
    intentCount: 5,
  },
  {
    source: "ai-studio",
    externalId: "topic-employee-management",
    name: "Employee Management",
    description: "Intents for employee onboarding, roles and access questions.",
    intentCount: 4,
  },
  {
    source: "ai-studio",
    externalId: "topic-connectors",
    name: "Connectors",
    description: "Intents for third-party connections, authentication and sync failures.",
    intentCount: 4,
  },
];

export const aiIntents: IntentRef[] = [
  i("intent-create-deal", "topic-deals", "Create Deal", "User wants to create a new deal.", 42),
  i("intent-edit-deal", "topic-deals", "Edit Deal", "User wants to change deal details.", 31),
  i("intent-delete-deal", "topic-deals", "Delete Deal", "User wants to remove a deal.", 18),
  i(
    "intent-why-cant-i-edit-a-deal",
    "topic-deals",
    "Why Can't I Edit a Deal?",
    "User is blocked from editing a deal, often permissions or a closed stage.",
    27,
  ),
  i(
    "intent-how-do-i-change-a-deal-stage",
    "topic-deals",
    "How Do I Change a Deal Stage?",
    "User wants to progress a deal through the pipeline.",
    23,
  ),

  i(
    "intent-add-employee",
    "topic-employee-management",
    "Add Employee",
    "User wants to create an employee record.",
    35,
  ),
  i(
    "intent-invite-employee",
    "topic-employee-management",
    "Invite Employee",
    "User wants to send a workspace invitation.",
    22,
  ),
  i(
    "intent-change-employee-role",
    "topic-employee-management",
    "Change Employee Role",
    "User wants to change permissions for an employee.",
    19,
  ),
  i(
    "intent-why-cant-i-access-employee-management",
    "topic-employee-management",
    "Why Can't I Access Employee Management?",
    "User lacks the role required to open the module.",
    14,
  ),

  i(
    "intent-connect-zoho-books",
    "topic-connectors",
    "Connect Zoho Books",
    "User wants to set up the Zoho Books connector.",
    29,
  ),
  i(
    "intent-zoho-authentication-failed",
    "topic-connectors",
    "Zoho Authentication Failed",
    "Zoho OAuth handshake fails or tokens expire.",
    24,
  ),
  i(
    "intent-invoice-synchronisation-failed",
    "topic-connectors",
    "Invoice Synchronisation Failed",
    "Invoices are not syncing between Aurumi and Zoho Books.",
    21,
  ),
  i(
    "intent-disconnect-zoho-books",
    "topic-connectors",
    "Disconnect Zoho Books",
    "User wants to remove the Zoho Books connection.",
    9,
  ),
];

function i(
  externalId: string,
  topicExternalId: string,
  name: string,
  description: string,
  utteranceCount: number,
): IntentRef {
  return { source: "ai-studio", externalId, topicExternalId, name, description, utteranceCount };
}
