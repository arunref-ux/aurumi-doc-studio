import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Prominent Help search entry point. Submitting navigates to the search route,
 * which owns retrieval through the Published Guide Delivery contract.
 */
export function HelpSearchBox({
  initialQuery = "",
  size = "hero",
  autoFocus = false,
}: {
  initialQuery?: string;
  size?: "hero" | "compact";
  autoFocus?: boolean;
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialQuery);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const q = value.trim();
        navigate({ to: "/help/search", search: q ? { q } : {} });
      }}
      className="relative w-full"
    >
      <Search
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "hero" ? "size-5" : "size-4",
        )}
      />
      <input
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search Aurumi Help…"
        aria-label="Search Aurumi Help"
        className={cn(
          "w-full rounded-full border border-border bg-help-surface text-foreground shadow-help-card outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
          size === "hero"
            ? "py-4 pl-12 pr-28 text-base sm:text-lg"
            : "py-2.5 pl-10 pr-24 text-sm",
        )}
      />
      <button
        type="submit"
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          size === "hero" ? "px-5 py-2.5 text-sm" : "px-4 py-1.5 text-xs",
        )}
      >
        Search
      </button>
    </form>
  );
}
