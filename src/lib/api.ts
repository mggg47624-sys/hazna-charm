const TOKEN_KEY = "khazna_token";

export const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5000";

type Envelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string | null;
  [k: string]: unknown;
};

export type ApiInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  isForm?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
};

export async function api<T = unknown>(path: string, init: ApiInit = {}): Promise<T> {

  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (init.body !== undefined && init.body !== null) {
    if (init.isForm) {
      body = init.body as FormData;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(init.body);
    }
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${API_BASE}${cleanPath}`;
  if (init.query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, body });
  } catch {
    throw new Error("Network error — check API connection");
  }

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  let json: Envelope<T> | T;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return undefined as T;
  }

  if (json && typeof json === "object" && "success" in (json as object)) {
    const env = json as Envelope<T>;
    if (!env.success) {
      throw new Error(env.error || env.message || "Request failed");
    }
    return (env.data !== undefined ? env.data : (env as unknown as T)) as T;
  }

  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return json as T;
}
