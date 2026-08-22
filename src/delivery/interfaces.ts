/**
 * Build 3A — Published Guide Delivery contract.
 *
 * Aurumi Doc Studio (authoring + workflow + publishing)
 *   -> Published Guide Delivery Layer (this contract)
 *      -> future Help Portal / future Aura Help / future in-product Help
 *
 * This contract is deliberately separate from the authoring, workflow and
 * internal Guide Studio management surfaces. It is STRICTLY READ-ONLY: there is
 * no create, edit, submit, approve, publish, archive or version operation here.
 *
 * Future consumers must depend only on this contract — never on Guide Studio
 * seed arrays, internal mock stores or provider internals.
 */

import type { PublishedGuide } from "@/domain/published-guide";
import type { GuideReferenceTarget } from "@/domain/types";

/** Composite association identity — never a bare externalId. */
export interface PublishedGuideRefQuery {
  source: string;
  kind: string;
  externalId: string;
}

/** Contextual discovery entry: a source reference that has published Help. */
export interface PublishedAssociationTarget {
  ref: GuideReferenceTarget;
  refKey: string;
  label: string;
  parentExternalId?: string;
  publishedGuideCount: number;
}

/**
 * Build 3B — consumer-oriented browse projection.
 *
 * A browse context is a published association target expressed in consumer
 * terms: a friendly label, a friendly kind label and (optionally) child
 * contexts. `refKey` stays an opaque handle: consumers pass it back to the
 * contract and never parse or display it.
 */
export interface PublishedBrowseContext {
  refKey: string;
  label: string;
  kindLabel: string;
  /** Published guides associated with this exact context. */
  publishedGuideCount: number;
  /** Published guides in this context and everything beneath it. */
  totalPublishedGuideCount: number;
  children: PublishedBrowseContext[];
}

/** A top-level browse area, one per source family (friendly labels only). */
export interface PublishedBrowseArea {
  areaId: string;
  label: string;
  description: string;
  totalPublishedGuideCount: number;
  contexts: PublishedBrowseContext[];
}

/** Deterministic, non-AI search hit. No ranking score is implied. */
export interface PublishedGuideSearchHit {
  guide: PublishedGuide;
  matchedIn: Array<"title" | "summary" | "content">;
}

export interface PublishedGuideDeliveryProvider {
  /** Only guides with a valid current published version. */
  listPublishedGuides(): Promise<PublishedGuide[]>;
  /** Current published content for one guide, or null (fail closed). */
  getPublishedGuide(guideId: string): Promise<PublishedGuide | null>;
  /** Contextual retrieval by composite identity (source + kind + externalId). */
  getPublishedGuidesByAssociation(query: PublishedGuideRefQuery): Promise<PublishedGuide[]>;
  /** Contextual retrieval by canonical refKey string. */
  getPublishedGuidesByRefKey(key: string): Promise<PublishedGuide[]>;
  /** Source references that currently have published Help available. */
  listPublishedAssociationTargets(): Promise<PublishedAssociationTarget[]>;
  /** Consumer browse tree derived from published associations only. */
  listPublishedBrowseAreas(): Promise<PublishedBrowseArea[]>;
  /** One browse context (with children), or null when it has no published Help. */
  getPublishedBrowseContext(refKey: string): Promise<PublishedBrowseContext | null>;
  /** Deterministic case-insensitive search over published content only. */
  searchPublishedGuides(query: string): Promise<PublishedGuideSearchHit[]>;
  /** Published guides sharing at least one published association target. */
  getRelatedPublishedGuides(guideId: string): Promise<PublishedGuide[]>;
}
