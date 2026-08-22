/**
 * Build 3C — Help Retrieval contract.
 *
 * Aurumi Doc Studio (authoring + workflow + publishing)
 *   -> Published Guide Delivery Layer (Build 3A, read-only)
 *      -> Help Retrieval Layer (this contract)
 *         -> Simulated Aura Help Integration Harness (Build 3C)
 *         -> Future Real Aura Integration (Build 3D)
 *
 * This is the contract the real Aura application is expected to consume. It is
 * STRICTLY READ-ONLY and published-only. It intentionally exposes no authoring
 * structures: no GuideVersion records, no workflow status, no lifecycle
 * pointers, no source/kind vocabulary beyond the composite reference needed to
 * express context, and no provider internals.
 *
 * Retrieval is deterministic. The response shape does not assume keyword search
 * forever: `outcome` + `reason` + ordered `results` leave room for a future
 * hybrid deterministic/semantic implementation behind the same contract.
 */

/**
 * Contextual reference carried by a Help request. Identity is ALWAYS composite
 * (source + kind + externalId) — a bare externalId is never an identity.
 */
export interface HelpContextRef {
  source: string;
  kind: string;
  externalId: string;
}

/** A Help request from a consumer such as Aura. */
export interface AuraHelpRequest {
  /** The user's Help question. Whitespace-only queries perform no retrieval. */
  query: string;
  /**
   * Optional context the consumer already knows (current app, feature, topic,
   * intent, connector, capability). Any subset is valid, including none.
   */
  context?: HelpContextRef[];
}

/**
 * A selectable Help context, described in consumer terms. Consumers display
 * `label` / `kindLabel` and pass `refs` back inside a request; they never parse
 * or render the composite reference itself.
 */
export interface HelpContextOption {
  /** Opaque handle, stable for a given context path. */
  contextId: string;
  /** Friendly path, e.g. "Deals → Create Deal". */
  label: string;
  /** Friendly kind wording, e.g. "App" or "App → Feature". */
  kindLabel: string;
  /** Grouping label, e.g. "Aurumi Apps", "AI Studio", "Connectors". */
  areaLabel: string;
  /** Composite references sent with the request, most specific first. */
  refs: HelpContextRef[];
  /** Published guides reachable through this context. */
  publishedGuideCount: number;
}

/** One published guide, projected for a conversational consumer. */
export interface HelpGuideResult {
  guideId: string;
  title: string;
  summary: string;
  /** Published version number, e.g. "1.0". Never a draft version. */
  versionNumber: string;
  /** Short, plain-text, consumer-safe excerpt of published content. */
  excerpt: string;
  /** Friendly context labels, e.g. ["Deals", "Create Deal"]. Never raw ids. */
  contextLabels: string[];
  /** Destination in the Aurumi Help Portal (Build 3B) for the full guide. */
  helpPortalPath: string;
}

/**
 * Retrieval outcome. Consumers branch on this instead of guessing from an
 * empty array, so "nothing published yet" stays distinguishable from
 * "ask me something more specific" and from "that request was not usable".
 */
export type HelpRetrievalOutcome =
  | "invalid-request"
  | "contextual-match"
  | "search-match"
  | "clarification"
  | "no-match";

/** Why the layer answered the way it did. Deterministic, human-readable. */
export type HelpRetrievalReason =
  | "empty-query"
  | "context-and-query"
  | "context-only"
  | "published-search"
  | "context-needed"
  | "nothing-published";

export interface AuraHelpResponse {
  /** Normalized (trimmed) query the layer actually retrieved against. */
  query: string;
  outcome: HelpRetrievalOutcome;
  reason: HelpRetrievalReason;
  /** Friendly labels for the context that was applied, in request order. */
  appliedContextLabels: string[];
  /** Single strongest match when retrieval resolved to exactly one guide. */
  primary: HelpGuideResult | null;
  /** All matched published guides, deterministically ordered. */
  results: HelpGuideResult[];
  /** Offered when the layer needs the consumer to narrow the request. */
  suggestedContexts: HelpContextOption[];
}

export interface HelpRetrievalProvider {
  /** Deterministic, published-only Help retrieval. */
  retrieve(request: AuraHelpRequest): Promise<AuraHelpResponse>;
  /** Contexts that currently have published Help, for context simulation. */
  listHelpContexts(): Promise<HelpContextOption[]>;
}
