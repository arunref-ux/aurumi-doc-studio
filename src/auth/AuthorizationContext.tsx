import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  GUIDE_ADMIN_PERMISSION,
  GUIDE_ACTIONS,
  type AuthorizedUser,
  type GuideActionKey,
  type GuidePermission,
} from "@/domain/permissions";
import { authorizationProvider } from "./index";
import type { AuthorizationApi } from "./interfaces";

interface AuthorizationContextValue extends AuthorizationApi {
  /** Prototype-only surface used by the development permission switcher. */
  simulation: {
    supported: boolean;
    users: AuthorizedUser[];
    switchUser: (userId: string) => void;
  };
  canRunAction(action: GuideActionKey): boolean;
}

const AuthorizationContext = createContext<AuthorizationContextValue | null>(null);

export function GuideStudioAuthorizationProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthorizedUser | null>(null);
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [current, simulated] = await Promise.all([
        authorizationProvider.getCurrentUser(),
        authorizationProvider.supportsSimulation
          ? authorizationProvider.listSimulatedUsers()
          : Promise.resolve([]),
      ]);
      if (cancelled) return;
      setUser(current);
      setUsers(simulated);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const switchUser = useCallback((userId: string) => {
    void (async () => {
      const next = await authorizationProvider.setCurrentUser(userId);
      setUser(next);
    })();
  }, []);

  const value = useMemo<AuthorizationContextValue>(() => {
    const permissions = new Set<GuidePermission>(user?.effectivePermissions ?? []);
    const isGuideAdmin = () => permissions.has(GUIDE_ADMIN_PERMISSION);
    const hasPermission = (permission: GuidePermission) =>
      isGuideAdmin() || permissions.has(permission);

    return {
      user,
      isLoading,
      hasPermission,
      hasAnyPermission: (list) => isGuideAdmin() || list.some((item) => permissions.has(item)),
      hasAllPermissions: (list) => isGuideAdmin() || list.every((item) => permissions.has(item)),
      isGuideAdmin,
      canRunAction: (action) => {
        const definition = GUIDE_ACTIONS[action];
        return isGuideAdmin() || definition.requires.some((item) => permissions.has(item));
      },
      simulation: {
        supported: authorizationProvider.supportsSimulation,
        users,
        switchUser,
      },
    };
  }, [user, users, isLoading, switchUser]);

  return <AuthorizationContext value={value}>{children}</AuthorizationContext>;
}

export function useAuthorization(): AuthorizationContextValue {
  const context = useContext(AuthorizationContext);
  if (!context) {
    throw new Error("useAuthorization must be used inside GuideStudioAuthorizationProvider");
  }
  return context;
}
