/**
 * Base URL for the custom backend API (see docs/architecture.md).
 * Set in `.env.local` as NEXT_PUBLIC_API_URL=https://api.example.com
 */
export function getPublicApiBaseUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_API_URL;
  return url && url.length > 0 ? url.replace(/\/$/, "") : undefined;
}
