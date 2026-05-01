/**
 * Public site configuration. Anything secret (Osclass API key, etc.) lives
 * in `src/lib/osclass/env.ts` and is only ever read on the server.
 */
export function getPublicSiteUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  return url && url.length > 0 ? url.replace(/\/$/, "") : undefined;
}
