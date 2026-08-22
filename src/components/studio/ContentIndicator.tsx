import { FileText, FileWarning } from "lucide-react";
import { versionHasContent } from "@/domain/guide-content";
import { cn } from "@/lib/utils";

/**
 * Presentation-only marker distinguishing versions that have authored content
 * from empty ones. Readiness itself is a domain rule (`versionHasContent`).
 */
export function ContentIndicator({
  contentMarkdown,
  className,
  showLabel = true,
}: {
  contentMarkdown: string;
  className?: string;
  showLabel?: boolean;
}) {
  const hasContent = versionHasContent(contentMarkdown);
  const words = hasContent ? contentMarkdown.trim().split(/\s+/).length : 0;

  return (
    <span
      title={
        hasContent
          ? `This version has content (~${words} words).`
          : "No content authored yet — this version cannot be submitted for review."
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        hasContent
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-destructive/30 bg-destructive/10 text-destructive",
        className,
      )}
    >
      {hasContent ? <FileText className="size-3" /> : <FileWarning className="size-3" />}
      {showLabel ? (hasContent ? "Content" : "No content") : null}
    </span>
  );
}
