import type { ProviderRegistry } from "./interfaces";
import { mockAIStudioProvider } from "./mock/ai-studio.mock";
import { mockConnectorProvider } from "./mock/connectors.mock";
import { mockDevHarmonyProvider } from "./mock/devharmony.mock";
import { mockGuideStudioProvider } from "./mock/guide-studio.mock";

/**
 * Single place where provider implementations are bound.
 * Swap these for HTTP-backed implementations to move off simulated data —
 * no UI or domain changes required.
 */
export const providers: ProviderRegistry = {
  devHarmony: mockDevHarmonyProvider,
  aiStudio: mockAIStudioProvider,
  connectors: mockConnectorProvider,
  guideStudio: mockGuideStudioProvider,
};

export type { ProviderRegistry } from "./interfaces";
