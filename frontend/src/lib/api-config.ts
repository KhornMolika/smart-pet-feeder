/**
 * Resolves the backend API base URL depending on runtime environment:
 * - Browser: Defaults to relative '' so all calls hit same-origin (/api/v1) via Traefik / Reverse Proxy,
 *   or NEXT_PUBLIC_BACKEND_URL if explicitly configured.
 * - Server (SSR / Server Actions): Uses BACKEND_INTERNAL_URL (e.g. http://backend:3001 in Docker)
 *   or falls back to localhost:3001 for local development.
 */
export function getBackendApiUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || '';
  }
  return (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:3001'
  );
}
