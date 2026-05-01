import "server-only";

import {
  osclass,
  OsclassNoFlavorError,
  OsclassApiError,
  OsclassUnsupportedOperationError,
} from "@/lib/osclass/client";
import { isOsclassConfigured } from "@/lib/osclass/env";
import type {
  OsclassCategory,
  OsclassCity,
  OsclassCountry,
  OsclassCurrency,
  OsclassRegion,
} from "@/lib/osclass/types";

/**
 * Reference data fetchers used by pages and route handlers. Each returns
 * a typed list and a `source` tag so callers can distinguish live data
 * from the empty fallback.
 *
 * The Osclass plugin endpoints these wrap return data that changes rarely
 * (regions/countries/cities/currencies/categories). The client caches them
 * for 1h via Next.js revalidate, so repeated SSR navigations are cheap.
 */

export type RefSource = "osclass" | "fallback";

export type RefList<T> = {
  items: T[];
  source: RefSource;
  fallbackReason?: string;
};

function describe(err: unknown): string {
  if (err instanceof OsclassNoFlavorError) {
    return `no-working-flavor: ${err.attempts.map((a) => `${a.flavor}=${a.reason}`).join(",")}`;
  }
  if (err instanceof OsclassUnsupportedOperationError) return "unsupported-by-flavor";
  if (err instanceof OsclassApiError) return `upstream-${err.status || "error"}`;
  if (err instanceof Error) return err.message;
  return String(err);
}

async function safe<T>(fn: () => Promise<T[]>): Promise<RefList<T>> {
  if (!isOsclassConfigured()) return { items: [], source: "fallback" };
  try {
    const items = await fn();
    return { items, source: "osclass" };
  } catch (err) {
    const reason = describe(err);
    console.warn("[data/locations] Osclass call failed:", reason);
    return { items: [], source: "fallback", fallbackReason: reason };
  }
}

export function listRegions(input: { countryCode?: string } = {}): Promise<RefList<OsclassRegion>> {
  return safe(() => osclass.listRegions(input));
}

export function listCountries(): Promise<RefList<OsclassCountry>> {
  return safe(() => osclass.listCountries());
}

export function listCities(input: { regionId?: number | string } = {}): Promise<RefList<OsclassCity>> {
  return safe(() => osclass.listCities(input));
}

export function listCurrencies(): Promise<RefList<OsclassCurrency>> {
  return safe(() => osclass.listCurrencies());
}

export function categoryTree(): Promise<RefList<OsclassCategory>> {
  return safe(() => osclass.categoryTree());
}
