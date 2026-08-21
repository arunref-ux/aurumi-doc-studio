import { mockAuthorizationProvider } from "./mock/authorization.mock";
import type { AuthorizationProvider } from "./interfaces";

/**
 * Single binding point for the authorization provider.
 * Swap this for the real Aurumi Access Control / RBAC provider later.
 */
export const authorizationProvider: AuthorizationProvider = mockAuthorizationProvider;

export type { AuthorizationApi, AuthorizationProvider } from "./interfaces";
