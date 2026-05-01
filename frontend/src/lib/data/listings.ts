import "server-only";

import { osclass, OsclassNoFlavorError, OsclassApiError } from "@/lib/osclass/client";
import { osclassToListing } from "@/lib/osclass/normalize";
import { isOsclassConfigured } from "@/lib/osclass/env";
import type { Listing } from "@/lib/types/listing";
import { filterListings, getListingBySlug } from "./mock-listings";

/**
 * Single data layer used by pages and route handlers.
 *
 * If the Osclass env vars are set and the upstream actually answers, this
 * calls Osclass. If Osclass is configured but the REST plugin is not yet
 * reachable (e.g. plugin not enabled, wrong URL), we automatically fall
 * back to the bundled mock data and report `source: "mock-fallback"` so
 * the page can show a soft banner.
 */

export type ListingSource = "osclass" | "mock" | "mock-fallback";

export type ListingListResult = {
  listings: Listing[];
  source: ListingSource;
  /** When source is "mock-fallback", a short reason useful for diagnostics. */
  fallbackReason?: string;
};

export type ListingDetailResult = {
  listing: Listing | undefined;
  source: ListingSource;
  fallbackReason?: string;
};

export type SearchInput = {
  query?: string;
  city?: string;
  region?: string;
  page?: number;
  pageSize?: number;
};

export async function searchListings(input: SearchInput = {}): Promise<ListingListResult> {
  if (isOsclassConfigured()) {
    try {
      const items = await osclass.listItems({
        query: input.query,
        city: input.city,
        region: input.region,
        page: input.page,
        pageSize: input.pageSize,
      });
      return { listings: items.map(osclassToListing), source: "osclass" };
    } catch (err) {
      const reason = describeFallback(err);
      console.warn("[data/listings] Osclass unreachable, falling back to mocks:", reason);
      return {
        listings: filterListings(input.query ?? ""),
        source: "mock-fallback",
        fallbackReason: reason,
      };
    }
  }
  return { listings: filterListings(input.query ?? ""), source: "mock" };
}

export async function getListing(slugOrId: string): Promise<ListingDetailResult> {
  if (isOsclassConfigured()) {
    try {
      const id = extractTrailingId(slugOrId) ?? slugOrId;
      const item = await osclass.getItem(id);
      return { listing: item ? osclassToListing(item) : undefined, source: "osclass" };
    } catch (err) {
      const reason = describeFallback(err);
      console.warn("[data/listings] Osclass unreachable, falling back to mock detail:", reason);
      return {
        listing: getListingBySlug(slugOrId),
        source: "mock-fallback",
        fallbackReason: reason,
      };
    }
  }
  return { listing: getListingBySlug(slugOrId), source: "mock" };
}

export type ContactInput = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

export async function sendListingContact(
  slugOrId: string,
  input: ContactInput
): Promise<{ ok: true; source: ListingSource; fallbackReason?: string }> {
  if (isOsclassConfigured()) {
    try {
      const id = extractTrailingId(slugOrId) ?? slugOrId;
      await osclass.sendContact(id, input);
      return { ok: true, source: "osclass" };
    } catch (err) {
      const reason = describeFallback(err);
      console.warn("[data/listings] contact send fell through to mock delivery:", reason);
      return { ok: true, source: "mock-fallback", fallbackReason: reason };
    }
  }
  return { ok: true, source: "mock" };
}

function extractTrailingId(slug: string): string | undefined {
  const m = /(\d+)$/.exec(slug);
  return m?.[1];
}

function describeFallback(err: unknown): string {
  if (err instanceof OsclassNoFlavorError) {
    return `no-working-flavor: ${err.attempts.map((a) => `${a.flavor}=${a.reason}`).join(",")}`;
  }
  if (err instanceof OsclassApiError) {
    return `upstream-${err.status || "error"}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
