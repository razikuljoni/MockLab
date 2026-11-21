/**
 * Resolves the base API URL for MockLab requests.
 * Uses NEXT_PUBLIC_API_URL when configured (e.g. Render production backend).
 * Defaults to http://localhost:3001 only for local development.
 * Never silently falls back to same-origin in production.
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:3001";
    }
    // In production without NEXT_PUBLIC_API_URL, route to the production API service host
    return "https://mocklab-api-prod.onrender.com";
  }
  return process.env.NODE_ENV === "production" ? "https://mocklab-api-prod.onrender.com" : "http://localhost:3001";
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mocklab_token");
}

export function getActiveWorkspaceId(): string {
  if (typeof window === "undefined") return "default";
  try {
    const raw = localStorage.getItem("mocklab_user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.workspaces?.[0]?.id) return u.workspaces[0].id;
    }
  } catch {}
  return "default";
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const base = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  try {
    const res = await fetch(url, { ...options, headers });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
      return { data: null, error: errorMsg, status: res.status };
    }
    return { data, error: null, status: res.status };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error", status: 0 };
  }
}
