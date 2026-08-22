import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Consumer-safe states. These never surface provider errors, integrity
 * failures, published-pointer problems or internal identifiers — the delivery
 * layer fails closed and the reader simply sees that nothing is available.
 */
export function HelpNotice({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-help-surface px-6 py-12 text-center shadow-help-card">
      <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 flex justify-center">
        {action ?? (
          <Link
            to="/help/browse"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse all help
          </Link>
        )}
      </div>
    </div>
  );
}

export function HelpSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-busy>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-xl border border-border/60 bg-help-surface"
        />
      ))}
    </div>
  );
}
