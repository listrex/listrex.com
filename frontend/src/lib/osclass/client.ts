import "server-only";

import { getOsclassConfig } from "./env";
import type { OsclassItem, OsclassListResponse } from "./types";

/**
 * Thin server-side client for the Osclass REST API plugin.
 *
 * The exact endpoint paths vary slightly between forks of the plugin; the
 * defaults below match the most widely used build (oscapi / Rest API Plugin).
 * If your plugin uses different paths, change `endpoints` only — callers stay the same.
 */
const endpoints = {
  listItems: "/items",
  itemById: (id: string | number) => `/items/${encodeURIComponent(String(id))}`,
  contactItem: (id: string | number) => `/items/${encodeURIComponent(String(id))}/contact`,
  createItem: "/items",
};

class OsclassNotConfiguredError extends Error {
  constructor() {
    super("Osclass API is not configured (set OSCLASS_API_BASE_URL and OSCLASS_API_KEY).");
    this.name = "OsclassNotConfiguredError";
  }
}

export class OsclassApiError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`Osclass API error ${status}`);
    this.name = "OsclassApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOpts = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | undefined | null>;
  body?: Record<string, unknown> | FormData;
  /** Cache control passed straight through to fetch. Defaults to no-store for safety. */
  cache?: RequestCache;
  revalidate?: number;
};

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const cfg = getOsclassConfig();
  if (!cfg) throw new OsclassNotConfiguredError();

  const url = new URL(cfg.baseUrl + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  url.searchParams.set("apiKey", cfg.apiKey);

  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers: {
      Accept: "application/json",
    },
    cache: opts.cache ?? "no-store",
  };
  if (opts.revalidate !== undefined) {
    init.next = { revalidate: opts.revalidate };
    delete init.cache;
  }

  if (opts.body instanceof FormData) {
    init.body = opts.body;
  } else if (opts.body) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new OsclassApiError(res.status, text);

  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new OsclassApiError(res.status, `Non-JSON response: ${text.slice(0, 200)}`);
  }
}

function unwrapList<T>(payload: OsclassListResponse<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

export const osclass = {
  isConfigured(): boolean {
    return Boolean(getOsclassConfig());
  },

  async listItems(params: {
    query?: string;
    city?: string;
    region?: string;
    categoryId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<OsclassItem[]> {
    const cfg = getOsclassConfig();
    const pageSize = Math.min(params.pageSize ?? cfg?.pageSize ?? 24, 50);
    const payload = await request<OsclassListResponse<OsclassItem>>(endpoints.listItems, {
      query: {
        sPattern: params.query,
        sCity: params.city,
        sRegion: params.region,
        catId: params.categoryId ?? cfg?.defaultCategoryId,
        iPage: params.page,
        iPageSize: pageSize,
      },
      revalidate: 60,
    });
    return unwrapList(payload);
  },

  async getItem(id: string | number): Promise<OsclassItem | undefined> {
    try {
      const payload = await request<OsclassItem | { data?: OsclassItem }>(
        endpoints.itemById(id),
        { revalidate: 60 }
      );
      if (payload && typeof payload === "object" && "data" in payload && payload.data) {
        return payload.data;
      }
      return payload as OsclassItem;
    } catch (err) {
      if (err instanceof OsclassApiError && err.status === 404) return undefined;
      throw err;
    }
  },

  async sendContact(
    id: string | number,
    input: { name: string; email: string; phone?: string; message: string }
  ): Promise<void> {
    await request(endpoints.contactItem(id), {
      method: "POST",
      body: {
        yourName: input.name,
        yourEmail: input.email,
        phoneNumber: input.phone ?? "",
        message: input.message,
      },
    });
  },

  async createItem(input: {
    title: string;
    description: string;
    price: number;
    currency: string;
    city: string;
    region: string;
    categoryId?: number;
    contactName: string;
    contactEmail: string;
  }): Promise<OsclassItem | undefined> {
    const cfg = getOsclassConfig();
    const body = {
      catId: input.categoryId ?? cfg?.defaultCategoryId,
      title: { en_US: input.title },
      description: { en_US: input.description },
      price: input.price,
      currency: input.currency,
      cityName: input.city,
      regionName: input.region,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      showEmail: 0,
    };
    const payload = await request<OsclassItem | { data?: OsclassItem }>(
      endpoints.createItem,
      { method: "POST", body }
    );
    if (payload && typeof payload === "object" && "data" in payload && payload.data) {
      return payload.data;
    }
    return payload as OsclassItem;
  },
};
