import { useBlocker } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Reusable unsaved-changes navigation guard.
 *
 * ONE mechanism covers every exit path:
 *  - internal router navigation (sidebar, Guide Library, opening another guide,
 *    workspace Back button, any <Link>) via the router's own blocker,
 *  - browser back / forward, which TanStack Router intercepts through the same
 *    blocker,
 *  - browser / tab unload via `beforeunload`.
 *
 * Consumers render `<guard.Dialog />` once and, for their own in-app controls,
 * call `guard.confirmNavigation(fn)` so those controls use the identical
 * confirmation UI instead of a second, inconsistent prompt.
 *
 * Build 2A.2 (rich content authoring) reuses this hook unchanged — it only
 * needs a `dirty` flag.
 */
export interface DirtyNavigationGuard {
  blocked: boolean;
  /** Runs `action` immediately when clean, otherwise asks for confirmation. */
  confirmNavigation: (action: () => void) => void;
  Dialog: () => ReactNode;
}

export function useDirtyNavigationGuard(
  dirty: boolean,
  options?: { title?: string; description?: string },
): DirtyNavigationGuard {
  const title = options?.title ?? "You have unsaved changes";
  const description =
    options?.description ??
    "Leaving now discards your unsaved edits to this guide. Stay to keep editing, or discard your changes to continue.";

  // Router-level block: covers sidebar, library, other guides, back/forward and
  // every internal route change.
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: dirty,
    withResolver: true,
  });

  // Belt-and-braces unload protection (kept from the previous implementation).
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const confirmNavigation = useCallback(
    (action: () => void) => {
      // Clean state navigates straight through; dirty state is caught by the
      // blocker above, which then shows the same dialog.
      action();
    },
    [],
  );

  const Dialog = useCallback(
    () => (
      <AlertDialog open={blocker.status === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Stay and Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [blocker, title, description],
  );

  return { blocked: blocker.status === "blocked", confirmNavigation, Dialog };
}
