import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, CornerDownLeft, Compass, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  AuraHelpResponse,
  HelpContextOption,
  HelpGuideResult,
} from "@/help-retrieval/interfaces";

/**
 * Build 3C — simulated Aura Help conversation surface.
 *
 * This is a presentation layer only. It receives an `AuraHelpResponse` produced
 * by the Help Retrieval Layer and renders it; it performs no retrieval, no
 * filtering, no status checks and no Markdown rendering (excerpts are plain
 * text, so the Help Portal remains the single sanitised rendering surface).
 */

export interface AuraTurn {
  id: string;
  question: string;
  /** Friendly context labels applied to this turn, if any. */
  contextLabel: string | null;
  state: "pending" | "answered" | "failed";
  response?: AuraHelpResponse;
}

interface Props {
  turns: AuraTurn[];
  pending: boolean;
  onAsk: (question: string) => void;
  onPickContext: (option: HelpContextOption) => void;
  suggestions: string[];
}

export function AuraHelpConversation({
  turns,
  pending,
  onAsk,
  onPickContext,
  suggestions,
}: Props) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!pending) inputRef.current?.focus();
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns.length, pending]);

  function submit() {
    const question = draft.trim();
    if (!question || pending) return;
    onAsk(question);
    setDraft("");
  }

  return (
    <div className="flex min-h-[32rem] flex-col">
      <div className="flex-1 space-y-5 px-1 py-2">
        {turns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquare className="size-4" />
              Ask + Learn
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Help answers "how do I use Aurumi" questions from published guides only. It does not
              read business data and does not run actions.
            </p>
            {suggestions.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onAsk(suggestion)}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {turns.map((turn) => (
          <div key={turn.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {turn.contextLabel ? (
                  <p className="mb-1 text-[0.6875rem] uppercase tracking-wide opacity-80">
                    Context: {turn.contextLabel}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap leading-relaxed">{turn.question}</p>
              </div>
            </div>

            <div className="max-w-[92%] space-y-3 text-sm">
              {turn.state === "pending" ? (
                <p className="animate-pulse text-muted-foreground">Looking through Aurumi Help…</p>
              ) : turn.state === "failed" || !turn.response ? (
                <p className="text-muted-foreground">
                  Help is temporarily unavailable. Please try again.
                </p>
              ) : (
                <AuraAnswer response={turn.response} onPickContext={onPickContext} />
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface p-2.5">
        <Textarea
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Ask Aura Help a question, e.g. “How do I create a Deal?”"
          rows={2}
          className="min-h-[3.25rem] resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-3 px-1 pt-1">
          <p className="text-[0.6875rem] text-muted-foreground">
            Deterministic retrieval · published guides only
          </p>
          <Button size="sm" onClick={submit} disabled={pending || !draft.trim()}>
            Ask Help
            <CornerDownLeft className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuraAnswer({
  response,
  onPickContext,
}: {
  response: AuraHelpResponse;
  onPickContext: (option: HelpContextOption) => void;
}) {
  if (response.outcome === "invalid-request") {
    return <p className="text-muted-foreground">Ask a Help question to get started.</p>;
  }

  if (response.outcome === "clarification") {
    return (
      <div className="space-y-3">
        <p className="text-foreground">Which area would you like help with?</p>
        <div className="flex flex-wrap gap-2">
          {response.suggestedContexts.map((option) => (
            <button
              key={option.contextId}
              type="button"
              onClick={() => onPickContext(option)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
            >
              <Compass className="size-3.5" />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (response.outcome === "no-match") {
    return (
      <div className="space-y-2">
        <p className="text-foreground">I couldn't find a published guide for that yet.</p>
        <p className="text-muted-foreground">
          Try different wording, or{" "}
          <Link to="/help/browse" className="underline underline-offset-4">
            browse Aurumi Help
          </Link>
          .
        </p>
      </div>
    );
  }

  const many = response.results.length > 1;
  const lead = response.primary
    ? "Here's a guide that can help:"
    : "I found a few guides that may help.";

  return (
    <div className="space-y-3">
      <p className="text-foreground">{lead}</p>
      {response.appliedContextLabels.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Using your current context: {response.appliedContextLabels.join(" → ")}
        </p>
      ) : null}
      <div className="space-y-2.5">
        {response.results.map((result) => (
          <ResultCard key={result.guideId} result={result} compact={many} />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ result, compact }: { result: HelpGuideResult; compact: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
        <BookOpen className="size-3.5" />
        Published v{result.versionNumber}
        {result.contextLabels.length > 0 ? <span>· {result.contextLabels[0]}</span> : null}
      </p>
      <h4 className="mt-1.5 text-sm font-semibold text-foreground">{result.title}</h4>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
      {!compact && result.excerpt ? (
        <p className="mt-2.5 border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">
          {result.excerpt}
        </p>
      ) : null}
      <Link
        to="/help/guide/$guideId"
        params={{ guideId: result.guideId }}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4"
      >
        {compact ? "View guide" : "View full guide"}
        <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
}
