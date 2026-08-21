import type { AuthorizedUser, GuidePermission } from "@/domain/permissions";

/**
 * Replacement seam: the mock provider satisfies this contract today, a real
 * Aurumi Access Control / RBAC provider can satisfy it later without any
 * UI changes.
 */
export interface AuthorizationProvider {
  getCurrentUser(): Promise<AuthorizedUser>;
  /** Prototype-only: list selectable simulated identities. Real provider returns []. */
  listSimulatedUsers(): Promise<AuthorizedUser[]>;
  /** Prototype-only: switch the active simulated identity. */
  setCurrentUser(userId: string): Promise<AuthorizedUser>;
  /** Whether this provider exposes prototype identity switching. */
  readonly supportsSimulation: boolean;
}

export interface AuthorizationApi {
  user: AuthorizedUser | null;
  isLoading: boolean;
  hasPermission(permission: GuidePermission): boolean;
  hasAnyPermission(permissions: GuidePermission[]): boolean;
  hasAllPermissions(permissions: GuidePermission[]): boolean;
  isGuideAdmin(): boolean;
}
