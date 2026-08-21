import { GUIDE_STATUS_LABELS, type GuideStatus } from "@/domain/types";
import { cn } from "@/lib/utils";

const styles: Record<GuideStatus, string> = {
  draft: "bg-status-draft text-status-draft-foreground",
  "in-review": "bg-status-review text-status-review-foreground",
  approved: "bg-status-approved text-status-approved-foreground",
  published: "bg-status-published text-status-published-foreground",
  archived: "bg-status-archived text-status-archived-foreground",
};

export function StatusBadge({ status, className }: { status: GuideStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {GUIDE_STATUS_LABELS[status]}
    </span>
  );
}
