import { refKey } from "@/domain/external-ref";
import type {
  CoverageBucket,
  CoverageEntity,
  CoverageFact,
  CoverageState,
  CoverageStateIndex,
  CoverageSummary,
  ExternalEntityKind,
  ExternalEntityReference,
} from "@/domain/types";
import type { ProviderRegistry } from "@/providers/interfaces";

/**
 * Application-level coverage composition service.
 *
 * External Providers + Guide Studio Provider -> Coverage Composition Service
 * -> Dashboard / Coverage / Sources UI.
 *
 * External hierarchies are enumerated only through provider interfaces; no
 * seed data is imported anywhere in this layer.
 */

function stateFor(fact: CoverageFact | undefined): CoverageState {
  if (!fact || !fact.authoringCoverage) {
    return fact?.publishedCoverage ? "published" : "not-started";
  }
  if (fact.publishedCoverage) return "published";
  return "in-progress";
}

function toBucket(
  label: string,
  kind: ExternalEntityKind,
  entities: CoverageEntity[],
): CoverageBucket {
  return {
    label,
    kind,
    total: entities.length,
    published: entities.filter((entity) => entity.state === "published").length,
    inProgress: entities.filter((entity) => entity.state === "in-progress").length,
    notStarted: entities.filter((entity) => entity.state === "not-started").length,
    entities,
  };
}

export function createCoverageService(providers: ProviderRegistry) {
  async function factIndex(): Promise<Map<string, CoverageFact>> {
    const facts = await providers.guideStudio.getCoverageFacts();
    return new Map(facts.map((fact) => [refKey(fact.ref), fact]));
  }

  function entity(
    ref: ExternalEntityReference,
    name: string,
    parentName: string | undefined,
    facts: Map<string, CoverageFact>,
  ): CoverageEntity {
    const fact = facts.get(refKey(ref));
    return {
      ref,
      name,
      ...(parentName ? { parentName } : {}),
      state: stateFor(fact),
      guideCount: fact?.guideCount ?? 0,
    };
  }

  async function getCoverageSummary(): Promise<CoverageSummary> {
    const [facts, apps, topics, connectors] = await Promise.all([
      factIndex(),
      providers.devHarmony.getApps(),
      providers.aiStudio.getTopics(),
      providers.connectors.getConnectors(),
    ]);

    const featureLists = await Promise.all(
      apps.map(async (app) => {
        const features = await providers.devHarmony.getFeaturesByApp(app.externalId);
        return features.map((feature) =>
          entity(
            { source: "devharmony", kind: "feature", externalId: feature.externalId },
            feature.name,
            app.name,
            facts,
          ),
        );
      }),
    );

    const intentLists = await Promise.all(
      topics.map(async (topic) => {
        const intents = await providers.aiStudio.getIntentsByTopic(topic.externalId);
        return intents.map((intent) =>
          entity(
            { source: "ai-studio", kind: "intent", externalId: intent.externalId },
            intent.name,
            topic.name,
            facts,
          ),
        );
      }),
    );

    const capabilityLists = await Promise.all(
      connectors.map(async (connector) => {
        const capabilities = await providers.connectors.getCapabilitiesByConnector(
          connector.externalId,
        );
        return capabilities.map((capability) =>
          entity(
            { source: "connector", kind: "capability", externalId: capability.externalId },
            capability.name,
            connector.name,
            facts,
          ),
        );
      }),
    );

    return {
      features: toBucket("DevHarmony Features", "feature", featureLists.flat()),
      intents: toBucket("AI Studio Intents", "intent", intentLists.flat()),
      capabilities: toBucket("Connector Capabilities", "capability", capabilityLists.flat()),
    };
  }

  /**
   * Composite-key coverage index for the Sources explorer. Covers every kind
   * a guide can reference (apps and topics included), so lazy-loaded rows can
   * resolve their state without enumerating hierarchies.
   */
  async function getCoverageStateIndex(): Promise<CoverageStateIndex> {
    const facts = await providers.guideStudio.getCoverageFacts();
    const index: CoverageStateIndex = {};
    for (const fact of facts) {
      index[refKey(fact.ref)] = stateFor(fact);
    }
    return index;
  }

  return { getCoverageSummary, getCoverageStateIndex };
}

export type CoverageService = ReturnType<typeof createCoverageService>;
