import type { AuthorizedUser } from "@/domain/permissions";
import type { AuthorizationProvider } from "../interfaces";
import { DEFAULT_USER_ID, SEEDED_USERS } from "./users";

const delay = (ms = 140) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = "guide-studio.prototype-user";

function readStored(): string {
  if (typeof window === "undefined") return DEFAULT_USER_ID;
  return window.sessionStorage.getItem(STORAGE_KEY) ?? DEFAULT_USER_ID;
}

let activeUserId = DEFAULT_USER_ID;

function find(userId: string): AuthorizedUser {
  return SEEDED_USERS.find((user) => user.id === userId) ?? SEEDED_USERS[0]!;
}

export const mockAuthorizationProvider: AuthorizationProvider = {
  supportsSimulation: true,
  async getCurrentUser() {
    await delay();
    activeUserId = find(readStored()).id;
    return find(activeUserId);
  },
  async listSimulatedUsers() {
    await delay(60);
    return SEEDED_USERS;
  },
  async setCurrentUser(userId: string) {
    await delay(60);
    activeUserId = find(userId).id;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, activeUserId);
    }
    return find(activeUserId);
  },
};
