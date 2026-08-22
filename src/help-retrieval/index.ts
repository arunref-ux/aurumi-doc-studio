import { publishedGuideDelivery } from "@/delivery";
import { createHelpRetrievalService } from "./help-retrieval.service";

/**
 * Build 3C — single binding point for the Help Retrieval Layer.
 *
 * Swap this for an API-backed or hybrid deterministic/semantic implementation
 * without touching any consumer (including the real Aura application later).
 */
export const helpRetrieval = createHelpRetrievalService(publishedGuideDelivery);

export type {
  AuraHelpRequest,
  AuraHelpResponse,
  HelpContextOption,
  HelpContextRef,
  HelpGuideResult,
  HelpRetrievalOutcome,
  HelpRetrievalProvider,
  HelpRetrievalReason,
} from "./interfaces";
