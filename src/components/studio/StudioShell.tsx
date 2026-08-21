import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ClipboardCheck,
  Database,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { UserSwitcher } from "@/components/studio/UserSwitcher";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/library", label: "Guide Library", icon: BookOpen },
  { to: "/review-queue", label: "Review Queue", icon: ClipboardCheck },
  { to: "/coverage", label: "Documentation Coverage", icon: ShieldCheck },
  { to: "/sources", label: "Sources", icon: Database },
];

export function StudioShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex size-8 items-center justify-center rounded-md bg-gold text-gold-foreground">
            <Sparkles className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Guide Studio</p>
            <p className="text-[0.6875rem] text-sidebar-muted">Aurumi Knowledge Ops</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2.5 py-2">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: Boolean(exact) }}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "bg-sidebar-primary text-sidebar-primary-foreground font-medium hover:bg-sidebar-primary",
              }}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4 text-[0.6875rem] leading-relaxed text-sidebar-muted">
          <p className="font-medium text-sidebar-foreground">Build 2A.1 · Prototype</p>
          <p>
            Guide and version creation is live. Rich content authoring, review and publishing arrive
            in later builds.
          </p>

        </div>
      </aside>

      <div className="lg:pl-60">
        <TopBar />
        <main className="mx-auto max-w-[1400px] px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/95 px-5 backdrop-blur lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <span className="flex size-7 items-center justify-center rounded-md bg-gold text-gold-foreground">
          <Sparkles className="size-3.5" />
        </span>
        <span className="text-sm font-semibold">Guide Studio</span>
      </div>
      <div className="hidden min-w-0 items-center gap-2 text-xs text-muted-foreground lg:flex">
        <span className="font-medium text-foreground">Aurumi Guide Studio</span>
        <span aria-hidden>·</span>
        <span>Help &amp; documentation authoring, management and knowledge source system</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Workspace: <span className="text-foreground">Aurumi Core</span>
        </span>
        <span
          className={cn(
            "hidden rounded-full border border-dashed border-border px-2 py-0.5 text-[0.6875rem] text-muted-foreground md:inline",
          )}
        >
          Prototype access simulation
        </span>
        <UserSwitcher />
      </div>
    </div>
  );
}
