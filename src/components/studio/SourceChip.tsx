import { SOURCE_LABELS, type SourceSystem } from "@/domain/types";
import { cn } from "@/lib/utils";

const accents: Record<SourceSystem, string> = {
  devharmony: "text-source-devharmony border-source-devharmony/25 bg-source-devharmony/5",
  "ai-studio": "text-source-ai border-source-ai/25 bg-source-ai/5",
  connector: "text-source-connector border-source-connector/25 bg-source-connector/5",
  "guide-studio": "text-primary border-primary/25 bg-primary/5",
};

export function SourceChip({
  source,
  children,
  className,
}: {
  source: SourceSystem;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        accents[source],
        className,
      )}
    >
      <span className="font-mono text-[0.625rem] uppercase tracking-wide opacity-80">
        {SOURCE_LABELS[source]}
      </span>
      {children ? <span className="text-foreground/80">{children}</span> : null}
    </span>
  );
}
