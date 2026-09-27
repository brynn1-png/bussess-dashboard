/** Auth context (plain value + hook) — kept out of the provider file so each
 * module exports either components or plain values (react-refresh rule). */

import { createContext, useContext } from "react";

import type { User } from "../../services/api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Landing route for a signed-in user: admins get the console, others the portal. */
export function homePath(role: User["role"] | null | undefined): string {
  return role === "admin" ? "/admin" : "/portal";
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
