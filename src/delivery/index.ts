import { providers } from "@/providers";
import { createPublishedGuideDeliveryService } from "./published-guide-delivery.service";

/**
 * Single binding point for the Published Guide Delivery Layer. Swap this for an
 * API / cached / search-backed implementation without touching consumers.
 */
export const publishedGuideDelivery = createPublishedGuideDeliveryService(providers);

export type {
  PublishedAssociationTarget,
  PublishedBrowseArea,
  PublishedBrowseContext,
  PublishedGuideDeliveryProvider,
  PublishedGuideRefQuery,
  PublishedGuideSearchHit,
} from "./interfaces";
