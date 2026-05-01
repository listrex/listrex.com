import "server-only";

import { getOsclassConfig, type OsclassConfig } from "./env";
import type { OsclassItem, OsclassListResponse } from "./types";

/**
 * Server-side client for the Osclass REST API plugin.
 *
 * Different REST plugins for Osclass use different URL conventions. Rather
 * than hard-code one, the client probes a small ordered list of "flavors"
 * on the first call, picks whichever returns valid JSON, and caches the
 * winner in process memory. Operators can pin a specific flavor via
 * `OSCLASS_API_FLAVOR=<id>` (see FLAVORS below).
 */

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

export class OsclassNoFlavorError extends Error {
  attempts: Array<{ flavor: string; status?: number; reason: string }>;
  constructor(attempts: OsclassNoFlavorError["attempts"]) {
    super(
      "Could not find a working Osclass REST URL. Tried: " +
        attempts.map((a) => `${a.flavor} (${a.reason})`).join("; ")
    );
    this.name = "OsclassNoFlavorError";
    this.attempts = attempts;
  }
}

type Operation =
  | { kind: "listItems"; query?: string; city?: string; region?: string; categoryId?: number; page?: number; pageSize?: number }
  | { kind: "getItem"; id: string | number }
  | { kind: "contactItem"; id: string | number; name: string; email: string; phone?: string; message: string }
  | { kind: "createItem"; title: string; description: string; price: number; currency: string; city: string; region: string; categoryId?: number; contactName: string; contactEmail: string };

type BuiltRequest = {
  url: URL;
  method: "GET" | "POST";
  headers: Record<string, string | undefined>;
  body?: string;
};

type Flavor = {
  id: string;
  /** When false, skipped if `OSCLASS_API_FLAVOR` is set to something else and not "auto". */
  enabled: boolean;
  build(op: Operation, cfg: OsclassConfig): BuiltRequest | null;
};

function origin(cfg: OsclassConfig): string {
  const u = new URL(cfg.baseUrl);
  return `${u.protocol}//${u.host}`;
}

function setKey(url: URL, cfg: OsclassConfig) {
  url.searchParams.set("apiKey", cfg.apiKey);
}

/**
 * Map our generic listItems params onto whatever query keys the flavor uses.
 * Most Osclass plugins reuse Osclass core's search param names.
 */
function applyListParams(
  url: URL,
  op: Extract<Operation, { kind: "listItems" }>,
  cfg: OsclassConfig
) {
  const pageSize = Math.min(op.pageSize ?? cfg.pageSize, 50);
  if (op.query) url.searchParams.set("sPattern", op.query);
  if (op.city) url.searchParams.set("sCity", op.city);
  if (op.region) url.searchParams.set("sRegion", op.region);
  const cat = op.categoryId ?? cfg.defaultCategoryId;
  if (cat !== undefined) url.searchParams.set("catId", String(cat));
  if (op.page !== undefined) url.searchParams.set("iPage", String(op.page));
  url.searchParams.set("iPageSize", String(pageSize));
}

/**
 * "Honor whatever the operator put in OSCLASS_API_BASE_URL".
 * If they set e.g. https://admin/api/v3, we treat it as the prefix.
 */
const flavorBase: Flavor = {
  id: "base",
  enabled: true,
  build(op, cfg) {
    switch (op.kind) {
      case "listItems": {
        const u = new URL(`${cfg.baseUrl}/items`);
        applyListParams(u, op, cfg);
        setKey(u, cfg);
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      }
      case "getItem": {
        const u = new URL(`${cfg.baseUrl}/items/${encodeURIComponent(String(op.id))}`);
        setKey(u, cfg);
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      }
      case "contactItem": {
        const u = new URL(`${cfg.baseUrl}/items/${encodeURIComponent(String(op.id))}/contact`);
        setKey(u, cfg);
        return {
          url: u,
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            yourName: op.name,
            yourEmail: op.email,
            phoneNumber: op.phone ?? "",
            message: op.message,
          }),
        };
      }
      case "createItem": {
        const u = new URL(`${cfg.baseUrl}/items`);
        setKey(u, cfg);
        return {
          url: u,
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            catId: op.categoryId ?? cfg.defaultCategoryId,
            title: { en_US: op.title },
            description: { en_US: op.description },
            price: op.price,
            currency: op.currency,
            cityName: op.city,
            regionName: op.region,
            contactName: op.contactName,
            contactEmail: op.contactEmail,
            showEmail: 0,
          }),
        };
      }
    }
  },
};

/**
 * Plugins exposing /api/vN/* via .htaccess rewrites
 * (e.g. Mindstellar Osclass REST API).
 */
function rewriteFlavor(version: 1 | 2 | 3): Flavor {
  return {
    id: `rewrite-v${version}`,
    enabled: true,
    build(op, cfg) {
      const o = origin(cfg);
      switch (op.kind) {
        case "listItems": {
          const u = new URL(`${o}/api/v${version}/items`);
          applyListParams(u, op, cfg);
          setKey(u, cfg);
          return { url: u, method: "GET", headers: { Accept: "application/json" } };
        }
        case "getItem": {
          const u = new URL(`${o}/api/v${version}/items/${encodeURIComponent(String(op.id))}`);
          setKey(u, cfg);
          return { url: u, method: "GET", headers: { Accept: "application/json" } };
        }
        case "contactItem": {
          const u = new URL(`${o}/api/v${version}/items/${encodeURIComponent(String(op.id))}/contact`);
          setKey(u, cfg);
          return {
            url: u,
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({
              yourName: op.name,
              yourEmail: op.email,
              phoneNumber: op.phone ?? "",
              message: op.message,
            }),
          };
        }
        case "createItem": {
          const u = new URL(`${o}/api/v${version}/items`);
          setKey(u, cfg);
          return {
            url: u,
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({
              catId: op.categoryId ?? cfg.defaultCategoryId,
              title: { en_US: op.title },
              description: { en_US: op.description },
              price: op.price,
              currency: op.currency,
              cityName: op.city,
              regionName: op.region,
              contactName: op.contactName,
              contactEmail: op.contactEmail,
              showEmail: 0,
            }),
          };
        }
      }
    },
  };
}

/**
 * Plugins exposing themselves through index.php?page=api&...
 * Several "REST API Plugin" forks register here.
 */
const flavorIndexPhpApi: Flavor = {
  id: "indexphp-api",
  enabled: true,
  build(op, cfg) {
    const o = origin(cfg);
    const u = new URL(`${o}/index.php`);
    u.searchParams.set("page", "api");
    setKey(u, cfg);
    switch (op.kind) {
      case "listItems":
        u.searchParams.set("action", "list");
        applyListParams(u, op, cfg);
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      case "getItem":
        u.searchParams.set("action", "item");
        u.searchParams.set("id", String(op.id));
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      case "contactItem":
        u.searchParams.set("action", "contact");
        u.searchParams.set("id", String(op.id));
        return {
          url: u,
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            yourName: op.name,
            yourEmail: op.email,
            phoneNumber: op.phone ?? "",
            message: op.message,
          }),
        };
      case "createItem":
        u.searchParams.set("action", "create");
        return {
          url: u,
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            catId: op.categoryId ?? cfg.defaultCategoryId,
            title: { en_US: op.title },
            description: { en_US: op.description },
            price: op.price,
            currency: op.currency,
            cityName: op.city,
            regionName: op.region,
            contactName: op.contactName,
            contactEmail: op.contactEmail,
            showEmail: 0,
          }),
        };
    }
  },
};

/**
 * Plugins registered as ajax actions (page=ajax&action=oc-rest).
 */
const flavorAjaxOcRest: Flavor = {
  id: "ajax-ocrest",
  enabled: true,
  build(op, cfg) {
    const o = origin(cfg);
    const u = new URL(`${o}/index.php`);
    u.searchParams.set("page", "ajax");
    u.searchParams.set("action", "oc-rest");
    setKey(u, cfg);
    switch (op.kind) {
      case "listItems":
        u.searchParams.set("route", "items");
        applyListParams(u, op, cfg);
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      case "getItem":
        u.searchParams.set("route", `items/${op.id}`);
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      case "contactItem":
        u.searchParams.set("route", `items/${op.id}/contact`);
        return {
          url: u,
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            yourName: op.name,
            yourEmail: op.email,
            phoneNumber: op.phone ?? "",
            message: op.message,
          }),
        };
      case "createItem":
        u.searchParams.set("route", "items");
        return {
          url: u,
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            catId: op.categoryId ?? cfg.defaultCategoryId,
            title: { en_US: op.title },
            description: { en_US: op.description },
            price: op.price,
            currency: op.currency,
            cityName: op.city,
            regionName: op.region,
            contactName: op.contactName,
            contactEmail: op.contactEmail,
            showEmail: 0,
          }),
        };
    }
  },
};

const FLAVORS: Flavor[] = [
  flavorBase,
  rewriteFlavor(3),
  rewriteFlavor(2),
  rewriteFlavor(1),
  flavorIndexPhpApi,
  flavorAjaxOcRest,
];

type FlavorCacheEntry =
  | { kind: "ok"; flavorId: string; at: number }
  | { kind: "fail"; at: number; attempts: OsclassNoFlavorError["attempts"] };

let flavorCache: FlavorCacheEntry | null = null;
const FAIL_TTL_MS = 30_000;

export function _resetFlavorCacheForTests() {
  flavorCache = null;
}

function pickFlavors(cfg: OsclassConfig): Flavor[] {
  const forced = process.env.OSCLASS_API_FLAVOR?.trim().toLowerCase();
  if (forced && forced !== "auto") {
    const match = FLAVORS.find((f) => f.id.toLowerCase() === forced);
    if (match) return [match];
  }
  void cfg;
  return FLAVORS.filter((f) => f.enabled);
}

type FetchResult =
  | { ok: true; status: number; json: unknown; text: string }
  | { ok: false; status: number; reason: string; text: string };

async function fetchOnce(req: BuiltRequest, timeoutMs = 7000): Promise<FetchResult> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string") headers[k] = v;
    }
    const res = await fetch(req.url, {
      method: req.method,
      headers,
      body: req.body,
      cache: "no-store",
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, reason: `HTTP ${res.status}`, text };
    }
    if (!text) return { ok: true, status: res.status, json: null, text };
    if (looksLikeHtml(text)) {
      return { ok: false, status: res.status, reason: "html-response", text };
    }
    try {
      const json = JSON.parse(text);
      return { ok: true, status: res.status, json, text };
    } catch {
      return { ok: false, status: res.status, reason: "non-json", text };
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : "fetch-failed";
    return { ok: false, status: 0, reason, text: "" };
  } finally {
    clearTimeout(t);
  }
}

function looksLikeHtml(text: string): boolean {
  const head = text.trimStart().slice(0, 64).toLowerCase();
  return head.startsWith("<!doctype") || head.startsWith("<html") || head.includes("<title>");
}

function looksLikeOsclassPluginNotLoaded(text: string): boolean {
  // Osclass core's ajax controller responds with this exact body when no
  // plugin is registered for the action. It's a 200, JSON-shaped response,
  // but it's a "wrong path" signal not a real result.
  if (text.includes('"no action defined"')) return true;
  return false;
}

/**
 * Validate that the parsed JSON looks like a list of items (or wraps one).
 * Used during auto-detect: we don't want to lock onto a flavor that returned
 * a "valid JSON" empty error object.
 */
function looksLikeItemList(json: unknown): boolean {
  if (Array.isArray(json)) return true;
  if (json && typeof json === "object" && Array.isArray((json as { data?: unknown }).data)) {
    return true;
  }
  return false;
}

async function probeFlavor(flavor: Flavor, cfg: OsclassConfig): Promise<FetchResult> {
  // Cheapest possible probe: list items, page size 1, no filters.
  const op: Operation = { kind: "listItems", pageSize: 1 };
  const built = flavor.build(op, cfg);
  if (!built) return { ok: false, status: 0, reason: "no-builder", text: "" };
  const result = await fetchOnce(built, 4000);
  if (!result.ok) return result;
  if (looksLikeOsclassPluginNotLoaded(result.text)) {
    return { ok: false, status: result.status, reason: "no-action-defined", text: result.text };
  }
  if (!looksLikeItemList(result.json)) {
    return { ok: false, status: result.status, reason: "not-a-list", text: result.text };
  }
  return result;
}

async function ensureFlavor(cfg: OsclassConfig): Promise<Flavor> {
  const now = Date.now();
  const cached = flavorCache;
  if (cached && cached.kind === "ok") {
    const f = FLAVORS.find((x) => x.id === cached.flavorId);
    if (f) return f;
  }
  if (cached && cached.kind === "fail" && now - cached.at < FAIL_TTL_MS) {
    throw new OsclassNoFlavorError(cached.attempts);
  }

  const candidates = pickFlavors(cfg);
  const attempts: OsclassNoFlavorError["attempts"] = [];
  for (const flavor of candidates) {
    const r = await probeFlavor(flavor, cfg);
    if (r.ok) {
      flavorCache = { kind: "ok", flavorId: flavor.id, at: now };
      return flavor;
    }
    attempts.push({ flavor: flavor.id, status: r.status || undefined, reason: r.reason });
  }
  flavorCache = { kind: "fail", at: now, attempts };
  throw new OsclassNoFlavorError(attempts);
}

async function call(op: Operation): Promise<unknown> {
  const cfg = getOsclassConfig();
  if (!cfg) throw new OsclassNotConfiguredError();
  const flavor = await ensureFlavor(cfg);
  const built = flavor.build(op, cfg);
  if (!built) {
    throw new OsclassApiError(0, `Flavor ${flavor.id} cannot build operation ${op.kind}`);
  }
  const result = await fetchOnce(built, 10_000);
  if (!result.ok) {
    // If the previously-good flavor stopped working, drop the cache so the
    // next request re-probes (e.g. plugin was reconfigured).
    if (flavorCache?.kind === "ok" && flavorCache.flavorId === flavor.id) {
      flavorCache = null;
    }
    throw new OsclassApiError(result.status, result.text || result.reason);
  }
  return result.json;
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

  /** Returns the flavor id currently cached, or null if never resolved. */
  getActiveFlavorId(): string | null {
    return flavorCache?.kind === "ok" ? flavorCache.flavorId : null;
  },

  async listItems(params: {
    query?: string;
    city?: string;
    region?: string;
    categoryId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<OsclassItem[]> {
    const payload = (await call({ kind: "listItems", ...params })) as OsclassListResponse<OsclassItem>;
    return unwrapList(payload);
  },

  async getItem(id: string | number): Promise<OsclassItem | undefined> {
    try {
      const payload = (await call({ kind: "getItem", id })) as
        | OsclassItem
        | { data?: OsclassItem };
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
    await call({ kind: "contactItem", id, ...input });
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
    const payload = (await call({ kind: "createItem", ...input })) as
      | OsclassItem
      | { data?: OsclassItem };
    if (payload && typeof payload === "object" && "data" in payload && payload.data) {
      return payload.data;
    }
    return payload as OsclassItem;
  },
};
