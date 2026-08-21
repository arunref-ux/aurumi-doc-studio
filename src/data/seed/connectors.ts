import type { CapabilityRef, ConnectorRef } from "@/domain/types";

export const connectors: ConnectorRef[] = [
  {
    source: "connector",
    externalId: "connector-zoho-books",
    name: "Zoho Books",
    vendor: "Zoho Corporation",
    category: "Accounting",
    capabilityCount: 4,
  },
  {
    source: "connector",
    externalId: "connector-whatsapp-business",
    name: "WhatsApp Business",
    vendor: "Meta Platforms",
    category: "Messaging",
    capabilityCount: 3,
  },
];

export const connectorCapabilities: CapabilityRef[] = [
  c(
    "capability-connect-zoho-books",
    "connector-zoho-books",
    "Connect Zoho Books",
    "Establish the Zoho Books connection for an organisation.",
  ),
  c(
    "capability-authenticate-account",
    "connector-zoho-books",
    "Authenticate Account",
    "Complete OAuth authentication and token refresh.",
  ),
  c(
    "capability-configure-invoice-synchronisation",
    "connector-zoho-books",
    "Configure Invoice Synchronisation",
    "Map and schedule invoice synchronisation.",
  ),
  c(
    "capability-disconnect-zoho-books",
    "connector-zoho-books",
    "Disconnect Zoho Books",
    "Revoke tokens and remove the connection.",
  ),
  c(
    "capability-connect-whatsapp-account",
    "connector-whatsapp-business",
    "Connect WhatsApp Account",
    "Link a WhatsApp Business account to Aurumi.",
  ),
  c(
    "capability-configure-business-number",
    "connector-whatsapp-business",
    "Configure Business Number",
    "Verify and configure the sending business number.",
  ),
  c(
    "capability-configure-message-synchronisation",
    "connector-whatsapp-business",
    "Configure Message Synchronisation",
    "Control inbound and outbound message sync.",
  ),
];

function c(
  externalId: string,
  connectorExternalId: string,
  name: string,
  description: string,
): CapabilityRef {
  return { source: "connector", externalId, connectorExternalId, name, description };
}
