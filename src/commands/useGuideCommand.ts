import { useCallback, useMemo } from "react";
import { useAuthorization } from "@/auth/AuthorizationContext";
import {
  executeCommand,
  type AuthorizationSnapshot,
  type CommandContext,
  type GuideCommand,
} from "./command-bus";

/**
 * Bridges the authorization context (mock today, real Aurumi RBAC later) to the
 * command bus. Components never build authorization snapshots themselves.
 */
export function useCommandContext(): CommandContext {
  const { user } = useAuthorization();
  return useMemo<CommandContext>(() => {
    const authorization: AuthorizationSnapshot | null = user
      ? { userId: user.id, permissions: user.effectivePermissions }
      : null;
    return { authorization };
  }, [user]);
}

/** Returns a runner for one command; the bus enforces action authorization. */
export function useGuideCommand<TInput, TResult>(command: GuideCommand<TInput, TResult>) {
  const context = useCommandContext();
  return useCallback(
    (input: TInput) => executeCommand(command, input, context),
    [command, context],
  );
}
