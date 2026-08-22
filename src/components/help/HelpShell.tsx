import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Build 3B — Aurumi Help Mode chrome.
 *
 * Deliberately minimal: the internal Doc Studio sidebar, workflow controls and
 * permission switcher are absent here. Same Aurumi identity (mark, IBM Plex
 * typography, ink + gold palette), recomposed for a calm reading experience.
 */
export function HelpShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-help-canvas">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-help-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/help" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gold text-gold-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-foreground">Aurumi Help</span>
              <span className="block text-[0.6875rem] text-muted-foreground">
                Guides &amp; how-tos
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <HeaderLink to="/help" exact label="Home" />
            <HeaderLink to="/help/browse" label="Browse" />
            <HeaderLink to="/help/search" label="Search" />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/70 bg-help-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Aurumi Help · Published guides only</p>
          <Link to="/" className="underline underline-offset-4 hover:text-foreground">
            Aurumi Guide Studio (internal)
          </Link>
        </div>
      </footer>
    </div>
  );
}

function HeaderLink({ to, label, exact }: { to: string; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: Boolean(exact) }}
      className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
    >
      {label}
    </Link>
  );
}
