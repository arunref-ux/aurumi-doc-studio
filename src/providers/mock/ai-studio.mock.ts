import { aiIntents, aiTopics } from "@/data/seed/ai-studio";
import type { AIStudioProvider } from "@/providers/interfaces";
import { clone, simulateRequest } from "./latency";

export const mockAIStudioProvider: AIStudioProvider = {
  getTopics: () =>
    simulateRequest(() => clone(aiTopics), { label: "AI Studio Topics API", failureRate: 0.04 }),

  getIntentsByTopic: (topicId) =>
    simulateRequest(
      () => clone(aiIntents.filter((intent) => intent.topicExternalId === topicId)),
      { label: "AI Studio Intents API", failureRate: 0.06 },
    ),
};
