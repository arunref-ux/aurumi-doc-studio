import { REFERENCE_KIND_LABELS, refKey, type ReferenceKind } from "@/domain/external-ref";
import { comparePublishedGuides, type PublishedGuide } from "@/domain/published-guide";
import type { PublishedGuideDeliveryProvider } from "@/delivery/interfaces";
import type {
  AuraHelpRequest,
  AuraHelpResponse,
  HelpContextOption,
  HelpContextRef,
  HelpGuideResult,
  HelpRetrievalProvider,
} from "./interfaces";

/**
 * Build 3C — Help Retrieval implementation.
 *
 * It COMPOSES the Published Guide Delivery contract (Build 3A) and nothing
 * else: no seed arrays, no Guide Studio provider, no mock stores, no authoring
 * or workflow provider. Published-only enforcement therefore stays entirely
 * below this layer, and this file can be replaced by an HTTP/API-backed or
 * hybrid deterministic+semantic implementation without touching consumers.
 *
 * Retrieval is deterministic: no LLM, no embeddings, no vectors, no semantic
 * ranking, no generated answers.
 */

/** Friendly grouping wording per source family. Raw source names never leak. */
const AREA_LABELS: Record<string, string> = {
  devharmony: "Aurumi Apps",
  "ai-studio": "AI Studio",
  connector: "Connectors",
};

/** Parent kinds and their child kind, per source family. */
const CONTEXT_KINDS: Array<{ source: string; parentKind: ReferenceKind; childKind: ReferenceKind }> =
  [
    { source: "devharmony", parentKind: "app", childKind: "feature" },
    { source: "ai-studio", parentKind: "topic", childKind: "intent" },
    { source: "connector", parentKind: "connector", childKind: "capability" },
  ];

/** Specific context kinds win over broad ones when ordering candidates. */
const SPECIFIC_KINDS = new Set<string>(["feature", "intent", "capability"]);

/** Words carrying no deterministic retrieval signal on their own. */
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "can", "configure", "create", "do", "does", "for",
  "from", "get", "help", "how", "i", "in", "is", "it", "me", "my", "of", "on", "one", "or", "set",
  "show", "the", "this", "to", "up", "use", "what", "when", "where", "which", "why", "with", "you",
]);

export function createHelpRetrievalService(
  delivery: PublishedGuideDeliveryProvider,
): HelpRetrievalProvider {
  async function listHelpContexts(): Promise<HelpContextOption[]> {
    const targets = await delivery.listPublishedAssociationTargets();
    const options: HelpContextOption[] = [];

    for (const { source, parentKind, childKind } of CONTEXT_KINDS) {
      const inArea = targets.filter((target) => target.ref.source === source);
      const parents = inArea.filter((target) => target.ref.kind === parentKind);
      const children = inArea.filter((target) => target.ref.kind === childKind);
      const parentByExternalId = new Map(
        parents.map((parent) => [parent.ref.externalId, parent] as const),
      );
      const areaLabel = AREA_LABELS[source] ?? source;

      for (const parent of parents) {
        options.push({
          contextId: parent.refKey,
          label: parent.label,
          kindLabel: REFERENCE_KIND_LABELS[parent.ref.kind],
          areaLabel,
          refs: [toContextRef(parent.ref)],
          publishedGuideCount: parent.publishedGuideCount,
        });
      }

      for (const child of children) {
        const parent = child.parentExternalId
          ? parentByExternalId.get(child.parentExternalId)
          : undefined;
        const refs = parent
          ? [toContextRef(child.ref), toContextRef(parent.ref)]
          : [toContextRef(child.ref)];
        options.push({
          contextId: child.refKey,
          label: parent ? `${parent.label} → ${child.label}` : child.label,
          kindLabel: parent
            ? `${REFERENCE_KIND_LABELS[parent.ref.kind]} → ${REFERENCE_KIND_LABELS[child.ref.kind]}`
            : REFERENCE_KIND_LABELS[child.ref.kind],
          areaLabel,
          refs,
          publishedGuideCount: child.publishedGuideCount,
        });
      }
    }

    return options.sort(
      (a, b) => a.areaLabel.localeCompare(b.areaLabel) || a.label.localeCompare(b.label),
    );
  }

  async function retrieve(request: AuraHelpRequest): Promise<AuraHelpResponse> {
    const query = request.query.trim();
    const context = (request.context ?? []).filter((ref) => ref.externalId.trim().length > 0);

    // STEP 1 — validate. A whitespace-only query performs no retrieval at all.
    if (!query) {
      return {
        query: "",
        outcome: "invalid-request",
        reason: "empty-query",
        appliedContextLabels: [],
        primary: null,
        results: [],
        suggestedContexts: [],
      };
    }

    const labelByRefKey = await contextLabelIndex();
    const appliedContextLabels = context.map((ref) => labelByRefKey.get(refKey(ref)) ?? "");

    // STEP 2 — explicit context first, most specific reference leading.
    if (context.length > 0) {
      const candidates = await retrieveByContext(context);
      if (candidates.length > 0) {
        // STEP 3 — deterministic query narrowing/ordering inside the context.
        const narrowed = narrowByQuery(candidates, query);
        const results = narrowed.matched.map((guide) => toResult(guide, labelByRefKey));
        return {
          query,
          outcome: "contextual-match",
          reason: narrowed.usedQuery ? "context-and-query" : "context-only",
          appliedContextLabels: appliedContextLabels.filter(Boolean),
          primary: results.length === 1 ? results[0]! : null,
          results,
          suggestedContexts: [],
        };
      }
    }

    // STEP 4 — deterministic published-only search fallback. It COMPOSES the
    // Build 3B published search capability (no second index, no raw scanning):
    // the phrase is searched first, then individual signal tokens, and hits are
    // merged with a fixed field weighting.
    const searched = await searchDeterministically(query);
    if (searched.length > 0) {
      const results = searched.map((guide) => toResult(guide, labelByRefKey));

      return {
        query,
        outcome: "search-match",
        reason: "published-search",
        appliedContextLabels: appliedContextLabels.filter(Boolean),
        primary: results.length === 1 ? results[0]! : null,
        results,
        suggestedContexts: [],
      };
    }

    // STEP 5 — nothing published matched. Never fall back to unpublished
    // content, never fabricate an answer. Offer contexts only when the request
    // carried no context and the question is deterministically ambiguous.
    const ambiguous = context.length === 0 && signalTokens(query).length === 0;
    if (ambiguous) {
      const contexts = await listHelpContexts();
      return {
        query,
        outcome: "clarification",
        reason: "context-needed",
        appliedContextLabels: [],
        primary: null,
        results: [],
        suggestedContexts: contexts.filter((option) => option.refs.length === 1),
      };
    }

    return {
      query,
      outcome: "no-match",
      reason: "nothing-published",
      appliedContextLabels: appliedContextLabels.filter(Boolean),
      primary: null,
      results: [],
      suggestedContexts: [],
    };
  }

  /**
   * Contextual retrieval through composite identity. Many-to-many by design:
   * one context may yield zero, one or many published guides.
   */
  async function retrieveByContext(context: HelpContextRef[]): Promise<PublishedGuide[]> {
    const ordered = [...context].sort(
      (a, b) => kindRank(a.kind) - kindRank(b.kind) || a.kind.localeCompare(b.kind),
    );

    const seen = new Set<string>();
    const candidates: PublishedGuide[] = [];
    for (const ref of ordered) {
      const guides = await delivery.getPublishedGuidesByAssociation({
        source: ref.source,
        kind: ref.kind,
        externalId: ref.externalId,
      });
      for (const guide of [...guides].sort(comparePublishedGuides)) {
        if (seen.has(guide.guideId)) continue;
        seen.add(guide.guideId);
        candidates.push(guide);
      }
    }
    return candidates;
  }

  /**
   * Deterministic phrase + token search over published content only. Every hit
   * comes from the Published Guide Delivery search capability, so published-only
   * enforcement is never re-implemented here.
   */
  async function searchDeterministically(query: string): Promise<PublishedGuide[]> {
    const scores = new Map<string, { guide: PublishedGuide; score: number }>();

    const record = (guide: PublishedGuide, weight: number) => {
      const existing = scores.get(guide.guideId);
      if (existing) existing.score += weight;
      else scores.set(guide.guideId, { guide, score: weight });
    };

    const phraseHits = await delivery.searchPublishedGuides(query);
    for (const hit of phraseHits) record(hit.guide, 10 + fieldWeight(hit.matchedIn));

    for (const token of signalTokens(query)) {
      const hits = await delivery.searchPublishedGuides(token);
      for (const hit of hits) record(hit.guide, fieldWeight(hit.matchedIn));
    }

    return [...scores.values()]
      .sort((a, b) => b.score - a.score || comparePublishedGuides(a.guide, b.guide))
      .map((entry) => entry.guide);
  }

  /** refKey -> friendly label, sourced only from published associations. */
  async function contextLabelIndex(): Promise<Map<string, string>> {
    const targets = await delivery.listPublishedAssociationTargets();
    return new Map(targets.map((target) => [target.refKey, target.label] as const));
  }

  return { retrieve, listHelpContexts };
}

function toContextRef(ref: HelpContextRef): HelpContextRef {
  return { source: ref.source, kind: ref.kind, externalId: ref.externalId };
}

function kindRank(kind: string): number {
  return SPECIFIC_KINDS.has(kind) ? 0 : 1;
}

/**
 * Deterministic narrowing: keep context candidates whose published title,
 * summary or content contain query signal tokens, ordered by token coverage.
 * When no token matches, the context answer is returned unnarrowed — there is
 * no invented semantic relevance.
 */
function narrowByQuery(
  candidates: PublishedGuide[],
  query: string,
): { matched: PublishedGuide[]; usedQuery: boolean } {
  const tokens = signalTokens(query);
  if (tokens.length === 0) return { matched: candidates, usedQuery: false };

  const scored = candidates.map((guide) => {
    const title = guide.title.toLowerCase();
    const summary = guide.summary.toLowerCase();
    const content = guide.contentMarkdown.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (title.includes(token)) score += 3;
      else if (summary.includes(token)) score += 2;
      else if (content.includes(token)) score += 1;
    }
    return { guide, score };
  });

  const matched = scored.filter((entry) => entry.score > 0);
  if (matched.length === 0) return { matched: candidates, usedQuery: false };

  return {
    matched: matched
      .sort((a, b) => b.score - a.score || comparePublishedGuides(a.guide, b.guide))
      .map((entry) => entry.guide),
    usedQuery: true,
  };
}

/** Query tokens that carry deterministic retrieval signal. */
function signalTokens(query: string): string[] {
  return [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
    ),
  ];
}

/** Published guide -> consumer-facing Help result. */
function toResult(guide: PublishedGuide, labels: Map<string, string>): HelpGuideResult {
  const contextLabels = [
    ...new Set(
      guide.refKeys
        .map((key) => labels.get(key))
        .filter((label): label is string => Boolean(label)),
    ),
  ];

  return {
    guideId: guide.guideId,
    title: guide.title,
    summary: guide.summary,
    versionNumber: guide.versionNumber,
    excerpt: toPlainTextExcerpt(guide.contentMarkdown),
    contextLabels,
    helpPortalPath: `/help/guide/${guide.guideId}`,
  };
}

/**
 * Plain-text excerpt. Deliberately NOT Markdown: the harness renders text only,
 * so no chat-specific Markdown/HTML renderer exists and the existing content
 * safety rules (sanitised rendering, safe links, HTTP/HTTPS-only images) remain
 * the single rendering path in the Help Portal.
 */
export function toPlainTextExcerpt(markdown: string, maxLength = 260): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Fixed field weighting: title beats summary beats body. */
function fieldWeight(matchedIn: Array<"title" | "summary" | "content">): number {
  let weight = 0;
  if (matchedIn.includes("title")) weight += 3;
  if (matchedIn.includes("summary")) weight += 2;
  if (matchedIn.includes("content")) weight += 1;
  return weight;
}
