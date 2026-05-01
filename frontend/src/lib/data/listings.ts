import "server-only";

import { osclass } from "@/lib/osclass/client";
import { osclassToListing } from "@/lib/osclass/normalize";
import { isOsclassConfigured } from "@/lib/osclass/env";
import type { Listing } from "@/lib/types/listing";
import { filterListings, getListingBySlug } from "./mock-listings";

/**
 * Single data layer used by pages and route handlers.
 *
 * If the Osclass env vars are set, this calls the Osclass REST plugin
 * (server-side, with the secret API key). Otherwise it falls back to the
 * bundled mock data so local UI work is never blocked.
 */

export type SearchInput = {
  query?: string;
  city?: string;
  region?: string;
  page?: number;
  pageSize?: number;
};

export async function searchListings(input: SearchInput = {}): Promise<Listing[]> {
  if (isOsclassConfigured()) {
    const items = await osclass.listItems({
      query: input.query,
      city: input.city,
      region: input.region,
      page: input.page,
      pageSize: input.pageSize,
    });
    return items.map(osclassToListing);
  }
  return filterListings(input.query ?? "");
}

/**
 * Resolve a listing by either an Osclass id or a slug-with-trailing-id
 * (e.g. "marina-waterfront-2br-42"). Falls back to the mock slug map.
 */
export async function getListing(slugOrId: string): Promise<Listing | undefined> {
  if (isOsclassConfigured()) {
    const id = extractTrailingId(slugOrId) ?? slugOrId;
    const item = await osclass.getItem(id);
    return item ? osclassToListing(item) : undefined;
  }
  return getListingBySlug(slugOrId);
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
): Promise<{ ok: true }> {
  if (isOsclassConfigured()) {
    const id = extractTrailingId(slugOrId) ?? slugOrId;
    await osclass.sendContact(id, input);
    return { ok: true };
  }
  // Mock mode: pretend to deliver. Replace once Osclass is wired.
  return { ok: true };
}

function extractTrailingId(slug: string): string | undefined {
  const m = /(\d+)$/.exec(slug);
  return m?.[1];
}
