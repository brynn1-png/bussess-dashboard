/**
 * Auth state: token + user, persisted in localStorage.
 * Components consume `useAuth()`; all auth API calls happen here, never in pages.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getMe,
  login as apiLogin,
  register as apiRegister,
  setToken,
  type User,
} from "../../services/api";
import { AuthContext, type AuthStatus } from "./auth-context";

const USER_KEY = "auth_user";

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem("auth_token") ? "loading" : "anonymous",
  );

  // On mount: validate any stored token against /auth/me before trusting it.
  useEffect(() => {
    if (status !== "loading") return;
    getMe()
      .then((me) => {
        localStorage.setItem(USER_KEY, JSON.stringify(me));
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setStatus("anonymous");
      });
  }, [status]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    setToken(res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const res = await apiRegister({
        full_name: fullName,
        email,
        password,
      });
      setToken(res.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setUser(res.user);
      setStatus("authenticated");
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
