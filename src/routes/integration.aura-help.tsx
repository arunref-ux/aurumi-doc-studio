import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Boxes, Plug, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AuraHelpConversation, type AuraTurn } from "@/components/aura/AuraHelpConversation";
import { PageHeader } from "@/components/studio/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuraHelpRequest, HelpContextOption } from "@/help-retrieval/interfaces";
import { helpRetrievalQueries } from "@/lib/queries";

export const Route = createFileRoute("/integration/aura-help")({
  head: () => ({
    meta: [
      { title: "Aura Help Integration Demo — Aurumi Guide Studio" },
      {
        name: "description",
        content:
          "Simulated Aura Help integration harness: a reference implementation of how Aura consumes the deterministic, published-only Help Retrieval contract.",
      },
      { property: "og:title", content: "Aura Help Integration Demo — Aurumi Guide Studio" },
      {
        property: "og:description",
        content:
          "Executable reference implementation of the Aura Help retrieval request/response contract, with context-aware deterministic retrieval.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuraHelpIntegrationDemo,
});

const GLOBAL_CONTEXT = "__global__";

const SUGGESTIONS = ["How do I create a Deal?", "How do I configure attendance?"];

function AuraHelpIntegrationDemo() {
  const queryClient = useQueryClient();
  const contexts = useQuery(helpRetrievalQueries.contexts());
  const [contextId, setContextId] = useState<string>(GLOBAL_CONTEXT);
  const [turns, setTurns] = useState<AuraTurn[]>([]);
  const [pending, setPending] = useState(false);

  const selected = useMemo(
    () => contexts.data?.find((option) => option.contextId === contextId) ?? null,
    [contexts.data, contextId],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, HelpContextOption[]>();
    for (const option of contexts.data ?? []) {
      const bucket = map.get(option.areaLabel) ?? [];
      bucket.push(option);
      map.set(option.areaLabel, bucket);
    }
    return [...map.entries()];
  }, [contexts.data]);

  /**
   * Every Help message crosses the Help Retrieval boundary. The harness never
   * touches Guide Studio, seed data, GuideVersion records or lifecycle state.
   */
  async function ask(question: string, option: HelpContextOption | null = selected) {
    const request: AuraHelpRequest = {
      query: question,
      ...(option ? { context: option.refs } : {}),
    };
    const id = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setPending(true);
    setTurns((current) => [
      ...current,
      { id, question, contextLabel: option?.label ?? null, state: "pending" },
    ]);

    try {
      const response = await queryClient.fetchQuery(helpRetrievalQueries.retrieve(request));
      setTurns((current) =>
        current.map((turn) => (turn.id === id ? { ...turn, state: "answered", response } : turn)),
      );
    } catch {
      // Safe consumer-facing failure: no draft fallback, no provider details.
      setTurns((current) =>
        current.map((turn) => (turn.id === id ? { ...turn, state: "failed" } : turn)),
      );
    } finally {
      setPending(false);
    }
  }

  function pickContext(option: HelpContextOption) {
    setContextId(option.contextId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aura Help Integration Demo"
        description="Simulated Aura Help harness. This is not the production Aura application — it is an executable reference implementation showing how Aura consumes the read-only Help Retrieval contract."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-border bg-muted/40 p-1 text-xs">
            <ModeChip icon={Boxes} label="Aurumi Apps" hint="Ask + Act" />
            <ModeChip icon={Plug} label="Connectors" hint="Ask + Act" />
            <ModeChip icon={Sparkles} label="Help" hint="Ask + Learn" active />
          </div>

          <div className="mt-5 border-b border-border pb-4">
            <h2 className="text-lg font-semibold text-foreground">Aura Help</h2>
            <p className="text-sm text-muted-foreground">
              Ask questions about how to use Aurumi
            </p>
            {selected ? (
              <p className="mt-1.5 text-xs font-medium text-foreground">
                Context: {selected.label}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">Context: Global Help</p>
            )}
          </div>

          <div className="mt-4">
            <AuraHelpConversation
              turns={turns}
              pending={pending}
              onAsk={(question) => void ask(question)}
              onPickContext={pickContext}
              suggestions={SUGGESTIONS}
            />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">Simulated Aura context</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Aura usually knows what the user is looking at. Selecting a context changes the actual
              Help Retrieval request, not just the label.
            </p>
            <Select value={contextId} onValueChange={setContextId}>
              <SelectTrigger className="mt-3">
                <SelectValue placeholder="No context / Global Help" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GLOBAL_CONTEXT}>No context / Global Help</SelectItem>
                {grouped.map(([areaLabel, options]) => (
                  <SelectGroup key={areaLabel}>
                    <SelectLabel>{areaLabel}</SelectLabel>
                    {options.map((option) => (
                      <SelectItem key={option.contextId} value={option.contextId}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {selected ? (
              <>
                <p className="mt-3 text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
                  Request context ({selected.kindLabel})
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {selected.refs.length === 1
                    ? "1 composite reference"
                    : `${selected.refs.length} composite references`}{" "}
                  sent with every question · {selected.publishedGuideCount} published guide
                  {selected.publishedGuideCount === 1 ? "" : "s"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setContextId(GLOBAL_CONTEXT)}
                >
                  Clear context
                </Button>
              </>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 text-xs leading-relaxed text-muted-foreground">
            <h3 className="text-sm font-semibold text-foreground">Integration boundary</h3>
            <p className="mt-1.5">
              This screen calls the Help Retrieval contract only. Published Guide Delivery resolves
              live content strictly through the published version pointer, so drafts, in-review,
              approved-but-unpublished and archived content can never appear here.
            </p>
            <p className="mt-2">
              Replacing this UI with the real Aura client is the migration step — the request and
              response contract stays the same.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">Try a scenario</h3>
            <div className="mt-2.5 space-y-2">
              <ScenarioButton
                label="Contextual: “How do I create one?”"
                hint="Pick a Deals context first"
                onClick={() => void ask("How do I create one?")}
                disabled={pending}
              />
              <ScenarioButton
                label="Global: “How do I create a Deal?”"
                hint="No context needed"
                onClick={() => void ask("How do I create a Deal?", null)}
                disabled={pending}
              />
              <ScenarioButton
                label="No match: “How do I reset the mainframe?”"
                hint="Clean no-answer response"
                onClick={() => void ask("How do I reset the mainframe?", null)}
                disabled={pending}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ModeChip({
  icon: Icon,
  label,
  hint,
  active,
}: {
  icon: typeof Boxes;
  label: string;
  hint: string;
  active?: boolean;
}) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-medium text-primary-foreground"
          : "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground"
      }
    >
      <Icon className="size-3.5" />
      {label}
      <span className={active ? "opacity-80" : "opacity-70"}>· {hint}</span>
    </span>
  );
}

function ScenarioButton({
  label,
  hint,
  onClick,
  disabled,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs transition-colors hover:bg-accent disabled:opacity-50"
    >
      <span className="block font-medium text-foreground">{label}</span>
      <span className="block text-muted-foreground">{hint}</span>
    </button>
  );
}
