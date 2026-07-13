import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "./api";
import type { CurrentUser } from "./types";
import {
  canAccess,
  isAgent,
  isQaAgent,
  isTsAgent,
  ROLE_LABELS,
  type Section,
} from "./permissions";

export type { Section } from "./permissions";

interface AuthCtx {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function normalizeUser(raw: any): CurrentUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw.user ?? raw.data?.user ?? raw.data ?? raw;
  const roleId = Number(u.roleId ?? u.RoleId ?? u.role_id ?? 0);
  return {
    id: Number(u.id ?? u.userId ?? u.Id ?? 0),
    userName: u.userName ?? u.username ?? u.UserName,
    username: u.username ?? u.userName,
    fullName: u.fullName ?? u.FullName ?? u.name,
    email: u.email ?? u.Email ?? "",
    roleId,
    roleName: u.roleName ?? u.RoleName,
    teamLeaderId: u.teamLeaderId ?? u.TeamLeaderId ?? null,
    isActive: u.isActive ?? u.IsActive ?? true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<any>("/api/users/me");
      const norm = normalizeUser(me);
      if (!norm) throw new Error("Invalid /api/users/me payload");
      setUser(norm);
    } catch (e) {
      console.error("[auth] /users/me failed:", e);
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    const resp = await api<any>("/api/auth/Login", {
      method: "POST",
      body: { email, password },
    });
    const token =
      typeof resp === "string"
        ? resp
        : resp?.token || resp?.accessToken || resp?.access_token ||
          resp?.data?.token || resp?.jwt;
    if (!token) throw new Error("No token returned");
    setToken(token);
    await fetchMe();
  };

  const logout = () => {
    clearToken();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout, refresh: fetchMe }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
};

/** Current user's role ID (0 if not loaded). */
export function useRoleId(): number {
  const { user } = useAuth();
  return Number(user?.roleId ?? 0);
}

export function useCanAccess(section: Section): boolean {
  const roleId = useRoleId();
  return canAccess(roleId, section);
}

export function useCanAccessReports(): boolean {
  return useCanAccess("qa:reports") || useCanAccess("ts:reports");
}

export function useIsAgent(): boolean {
  return isAgent(useRoleId());
}
export function useIsQaAgent(): boolean {
  return isQaAgent(useRoleId());
}
export function useIsTsAgent(): boolean {
  return isTsAgent(useRoleId());
}

export function useRoleLabel(): string {
  const { user } = useAuth();
  const roleId = Number(user?.roleId ?? 0);
  return ROLE_LABELS[roleId] || user?.roleName || "User";
}
