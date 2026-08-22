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
}
