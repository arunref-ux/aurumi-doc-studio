import { MessageCircle } from "lucide-react";

/**
 * Build 3C placeholder only. Intentionally inert: no chat, no LLM call, no AI
 * retrieval. It exists to reserve the future bridge between browsing Help and
 * asking Aura, and is labelled as coming soon so it cannot confuse readers.
 */
export function AskAuraTeaser() {
  return (
    <aside className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <MessageCircle className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Need more help? Ask Aura</p>
          <p className="text-xs text-muted-foreground">
            Conversational help is on the way. For now, browse or search the guides above.
          </p>
        </div>
      </div>
      <span className="shrink-0 self-start rounded-full border border-border bg-help-surface px-3 py-1 text-[0.6875rem] font-medium text-muted-foreground sm:self-auto">
        Coming soon
      </span>
    </aside>
  );
}
