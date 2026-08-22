import { Outlet, createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help/HelpShell";

/**
 * Build 3B — Aurumi Help Portal boundary route.
 *
 * Everything under /help is a read-only consumer of the Published Guide
 * Delivery contract. No authoring, workflow or publishing surface is reachable
 * from here, and no internal Doc Studio chrome is rendered.
 */
export const Route = createFileRoute("/help")({
  component: HelpLayout,
});

function HelpLayout() {
  return (
    <HelpShell>
      <Outlet />
    </HelpShell>
  );
}
