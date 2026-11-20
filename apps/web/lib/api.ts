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
