import "server-only";

/**
 * Server-only Osclass configuration.
 *
 * These values come from `.env.local` (or the host environment) and must
 * never be referenced from a client component. The frontend only ever
 * talks to our own `/api/*` routes, which talk to Osclass on the server.
 */
export type OsclassConfig = {
  baseUrl: string;
  apiKey: string;
  defaultCategoryId?: number;
  pageSize: number;
};

export function getOsclassConfig(): OsclassConfig | undefined {
  const baseUrl = process.env.OSCLASS_API_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.OSCLASS_API_KEY;
  if (!baseUrl || !apiKey) return undefined;

  const categoryRaw = process.env.OSCLASS_DEFAULT_CATEGORY_ID;
  const defaultCategoryId =
    categoryRaw && /^\d+$/.test(categoryRaw) ? Number(categoryRaw) : undefined;

  const pageSizeRaw = process.env.OSCLASS_PAGE_SIZE;
  const pageSize =
    pageSizeRaw && /^\d+$/.test(pageSizeRaw) ? Math.min(Number(pageSizeRaw), 50) : 24;

  return { baseUrl, apiKey, defaultCategoryId, pageSize };
}

export function isOsclassConfigured(): boolean {
  return Boolean(getOsclassConfig());
}

export function isOsclassDebugEnabled(): boolean {
  const raw = process.env.OSCLASS_DEBUG;
  if (!raw) return false;
  const v = raw.toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
