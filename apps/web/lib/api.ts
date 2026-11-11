/**
 * Resolves the base API URL for MockLab requests.
 * Uses NEXT_PUBLIC_API_URL when configured (e.g. Render production backend).
 * Defaults to http://localhost:3001 in local development.
 * In browser production if unset, falls back to same-origin.
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:3001";
    }
    return "";
  }
  return process.env.NODE_ENV === "production" ? "" : "http://localhost:3001";
}
