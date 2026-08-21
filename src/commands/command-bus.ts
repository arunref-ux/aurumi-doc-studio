import {
  GUIDE_ACTIONS,
  GUIDE_ADMIN_PERMISSION,
  type GuideActionKey,
  type GuidePermission,
} from "@/domain/permissions";

/**
 * Central command / mutation authorization boundary.
 *
 * UI Permission Gate -> Command -> Central Action Authorization -> Provider.
 *
 * Every Guide Studio mutation MUST run through `executeCommand`. UI hiding or
 * disabled buttons are never authorization.
 */

export interface AuthorizationSnapshot {
  userId: string;
  /** Effective permissions resolved by the authorization provider. */
  permissions: GuidePermission[];
}

export class UnauthorizedActionError extends Error {
  constructor(
    public readonly action: GuideActionKey,
    public readonly required: GuidePermission[],
  ) {
    super(
      `Not authorized to perform "${GUIDE_ACTIONS[action].label}". Requires: ${required.join(" or ")}.`,
    );
    this.name = "UnauthorizedActionError";
  }
}

export class CommandNotImplementedError extends Error {
  constructor(action: GuideActionKey) {
    super(`"${GUIDE_ACTIONS[action].label}" is not implemented in Build 1.`);
    this.name = "CommandNotImplementedError";
  }
}

/** Single decision rule: effective permissions, with guide.admin as override. */
export function isActionAuthorized(
  action: GuideActionKey,
  snapshot: AuthorizationSnapshot | null,
): boolean {
  if (!snapshot) return false;
  if (snapshot.permissions.includes(GUIDE_ADMIN_PERMISSION)) return true;
  return GUIDE_ACTIONS[action].requires.some((permission) =>
    snapshot.permissions.includes(permission),
  );
}

export function assertActionAuthorized(
  action: GuideActionKey,
  snapshot: AuthorizationSnapshot | null,
): void {
  if (!isActionAuthorized(action, snapshot)) {
    throw new UnauthorizedActionError(action, GUIDE_ACTIONS[action].requires);
  }
}

export interface CommandContext {
  authorization: AuthorizationSnapshot | null;
}

export interface GuideCommand<TInput, TResult> {
  action: GuideActionKey;
  handler: (input: TInput, context: CommandContext) => Promise<TResult>;
}

export function defineCommand<TInput, TResult>(
  action: GuideActionKey,
  handler: (input: TInput, context: CommandContext) => Promise<TResult>,
): GuideCommand<TInput, TResult> {
  return { action, handler };
}

/** Not-yet-implemented Build 2 mutation that still enforces authorization. */
export function definePlannedCommand<TInput>(action: GuideActionKey): GuideCommand<TInput, never> {
  return defineCommand<TInput, never>(action, async () => {
    throw new CommandNotImplementedError(action);
  });
}

/**
 * The only sanctioned path to a Guide Studio mutation. Authorization is
 * checked here, before the provider is ever reached.
 */
export async function executeCommand<TInput, TResult>(
  command: GuideCommand<TInput, TResult>,
  input: TInput,
  context: CommandContext,
): Promise<TResult> {
  assertActionAuthorized(command.action, context.authorization);
  return command.handler(input, context);
}
