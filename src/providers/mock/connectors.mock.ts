import { connectorCapabilities, connectors } from "@/data/seed/connectors";
import type { ConnectorProvider } from "@/providers/interfaces";
import { clone, simulateRequest } from "./latency";

export const mockConnectorProvider: ConnectorProvider = {
  getConnectors: () =>
    simulateRequest(() => clone(connectors), { label: "Connector Registry API", failureRate: 0.04 }),

  getCapabilitiesByConnector: (connectorId) =>
    simulateRequest(
      () =>
        clone(
          connectorCapabilities.filter(
            (capability) => capability.connectorExternalId === connectorId,
          ),
        ),
      { label: "Connector Capabilities API", failureRate: 0.05 },
    ),
};
