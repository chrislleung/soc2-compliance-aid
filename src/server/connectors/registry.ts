import type { ConnectorProvider } from "@/lib/contracts";

import { connectorRegistry } from "./mock-connectors";
import type { DemoConnector } from "./types";

export const supportedConnectorProviders = ["aws", "azure", "github", "gusto", "rippling"] as const satisfies readonly ConnectorProvider[];

export const connectorIdsByProvider: Readonly<Record<ConnectorProvider, string>> = {
  aws: "conn-aws",
  azure: "conn-azure",
  github: "conn-github",
  gusto: "conn-gusto",
  rippling: "conn-rippling",
};

const providersByConnectorId: Readonly<Record<string, ConnectorProvider>> = {
  "conn-aws": "aws",
  "conn-azure": "azure",
  "conn-github": "github",
  "conn-gusto": "gusto",
  "conn-rippling": "rippling",
};

export function getConnector(provider: ConnectorProvider): DemoConnector {
  return connectorRegistry[provider];
}

export const getConnectorByProvider = getConnector;

export function getConnectorById(connectorId: string): DemoConnector | null {
  const provider = getProviderForConnectorId(connectorId);

  return provider ? getConnector(provider) : null;
}

export function getProviderForConnectorId(connectorId: string): ConnectorProvider | null {
  return providersByConnectorId[connectorId] ?? null;
}

export function listRegisteredConnectors(): DemoConnector[] {
  return supportedConnectorProviders.map((provider) => getConnector(provider));
}
