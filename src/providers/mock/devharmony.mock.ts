import {
  devHarmonyApps,
  devHarmonyFeatures,
  devHarmonyFeatureVersions,
} from "@/data/seed/devharmony";
import type { DevHarmonyProvider } from "@/providers/interfaces";
import { clone, simulateRequest } from "./latency";

export const mockDevHarmonyProvider: DevHarmonyProvider = {
  getApps: () =>
    simulateRequest(() => clone(devHarmonyApps), { label: "DevHarmony Apps API", failureRate: 0.04 }),

  getFeaturesByApp: (appId) =>
    simulateRequest(
      () => clone(devHarmonyFeatures.filter((feature) => feature.appExternalId === appId)),
      { label: "DevHarmony Features API", failureRate: 0.06 },
    ),

  getFeatureVersions: (featureId) =>
    simulateRequest(
      () =>
        clone(
          devHarmonyFeatureVersions
            .filter((version) => version.featureExternalId === featureId)
            .sort((a, b) => a.version.localeCompare(b.version)),
        ),
      { label: "DevHarmony Feature Versions API", minLatency: 160, maxLatency: 420 },
    ),
};
