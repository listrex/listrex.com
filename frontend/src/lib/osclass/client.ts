import "server-only";

import { getOsclassConfig, type OsclassConfig } from "./env";
import type {
  OsclassCategory,
  OsclassCity,
  OsclassCountry,
  OsclassCurrency,
  OsclassItem,
  OsclassRegion,
} from "./types";

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
  | { kind: "createItem"; title: string; description: string; price: number; currency: string; city: string; region: string; categoryId?: number; contactName: string; contactEmail: string }
  | { kind: "listRegions"; countryCode?: string }
  | { kind: "listCountries" }
  | { kind: "listCities"; regionId?: number | string }
  | { kind: "listCurrencies" }
  | { kind: "categoryTree" };

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
      default:
        return null;
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
        default:
          return null;
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
      default:
        return null;
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
      default:
        return null;
    }
  },
};

/**
 * OsclassPoint "Rest API Osclass Plugin" (folder name: rest, file: api.php).
 *
 * URL shape:
 *   <origin>/oc-content/plugins/rest/api.php
 *     ?key=<apiKey>
 *     &type=read|insert|update|delete
 *     &object=<resource>          (search, item, items, currencies, region, ...)
 *     &action=<verb>              (items, latestItems, premiumItems, byId, ...)
 *     &<extra>                    (itemId, categoryId, sCity, sPattern, ...)
 *
 * Response envelope:
 *   { "status": "OK"|"ERROR", "message": "...", "block_id": <int>,
 *     "execution_seconds": "<float>", "response": <array|object> }
 *
 * Verified against admin.listrex.com (Osclass 8.3.1) — see docs.
 */
const flavorOsclassPoint: Flavor = {
  id: "osclasspoint",
  enabled: true,
  build(op, cfg) {
    const o = origin(cfg);
    const u = new URL(`${o}/oc-content/plugins/rest/api.php`);
    u.searchParams.set("key", cfg.apiKey);
    switch (op.kind) {
      case "listItems": {
        u.searchParams.set("type", "read");
        u.searchParams.set("object", "search");
        u.searchParams.set("action", "items");
        const pageSize = Math.min(op.pageSize ?? cfg.pageSize, 50);
        if (op.query) u.searchParams.set("sPattern", op.query);
        if (op.city) u.searchParams.set("sCity", op.city);
        if (op.region) u.searchParams.set("sRegion", op.region);
        const cat = op.categoryId ?? cfg.defaultCategoryId;
        if (cat !== undefined) u.searchParams.set("sCategory", String(cat));
        if (op.page !== undefined) u.searchParams.set("iPage", String(op.page));
        u.searchParams.set("iPageSize", String(pageSize));
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      }
      case "getItem": {
        u.searchParams.set("type", "read");
        u.searchParams.set("object", "item");
        u.searchParams.set("action", "byId");
        u.searchParams.set("itemId", String(op.id));
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      }
      case "contactItem": {
        // Plugin documents POST forms identical to bender theme; the
        // contact-form handler isn't exposed in the public docs, so leave
        // unimplemented and let the data layer fall back to mock delivery.
        return null;
      }
      case "createItem": {
        u.searchParams.set("type", "insert");
        u.searchParams.set("object", "item");
        u.searchParams.set("action", "add");
        const form = new URLSearchParams();
        const cat = op.categoryId ?? cfg.defaultCategoryId;
        if (cat !== undefined) form.set("catId", String(cat));
        form.set("title[en_US]", op.title);
        form.set("description[en_US]", op.description);
        form.set("price", String(op.price));
        form.set("currency", op.currency);
        form.set("cityName", op.city);
        form.set("regionName", op.region);
        form.set("contactName", op.contactName);
        form.set("contactEmail", op.contactEmail);
        form.set("showEmail", "0");
        return {
          url: u,
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form.toString(),
        };
      }
      case "listRegions": {
        u.searchParams.set("type", "read");
        u.searchParams.set("object", "region");
        u.searchParams.set("action", "listAll");
        if (op.countryCode) u.searchParams.set("countryCode", op.countryCode);
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      }
      case "listCountries": {
        u.searchParams.set("type", "read");
        u.searchParams.set("object", "country");
        u.searchParams.set("action", "listAll");
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      }
      case "listCities": {
        u.searchParams.set("type", "read");
        u.searchParams.set("object", "city");
        u.searchParams.set("action", "listAll");
        if (op.regionId !== undefined) u.searchParams.set("regionId", String(op.regionId));
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      }
      case "listCurrencies": {
        // NOTE: The OsclassPoint plugin uses the plural object name for the
        // currencies list (`object=currencies`) but singular for byId
        // (`object=currency`). Quirky but verified live.
        u.searchParams.set("type", "read");
        u.searchParams.set("object", "currencies");
        u.searchParams.set("action", "listAll");
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      }
      case "categoryTree": {
        u.searchParams.set("type", "read");
        u.searchParams.set("object", "category");
        u.searchParams.set("action", "tree");
        return { url: u, method: "GET", headers: { Accept: "application/json" } };
      }
    }
  },
};

const FLAVORS: Flavor[] = [
  flavorOsclassPoint,
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

type FetchPolicy =
  | { kind: "no-store" }
  | { kind: "revalidate"; seconds: number };

async function fetchOnce(
  req: BuiltRequest,
  timeoutMs = 7000,
  policy: FetchPolicy = { kind: "no-store" }
): Promise<FetchResult> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string") headers[k] = v;
    }
    const init: RequestInit & { next?: { revalidate?: number } } = {
      method: req.method,
      headers,
      body: req.body,
      signal: ctrl.signal,
    };
    if (policy.kind === "revalidate") {
      init.next = { revalidate: policy.seconds };
    } else {
      init.cache = "no-store";
    }
    const res = await fetch(req.url, init);
    const text = await res.text();
    if (!text) {
      if (!res.ok) return { ok: false, status: res.status, reason: `HTTP ${res.status}`, text };
      return { ok: true, status: res.status, json: null, text };
    }
    if (looksLikeHtml(text)) {
      return { ok: false, status: res.status, reason: "html-response", text };
    }
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      if (!res.ok) return { ok: false, status: res.status, reason: `HTTP ${res.status}`, text };
      return { ok: false, status: res.status, reason: "non-json", text };
    }
    // Some plugins (notably OsclassPoint's REST) return HTTP 404 with a
    // valid JSON envelope `{ status: "OK", ... }` for empty results. Trust
    // the envelope's status if it's present.
    const envelopeStatus = readEnvelopeStatus(json);
    if (envelopeStatus === "OK") {
      return { ok: true, status: res.status, json, text };
    }
    if (envelopeStatus === "ERROR") {
      const msg = readEnvelopeMessage(json) ?? "envelope-error";
      return { ok: false, status: res.status, reason: msg, text };
    }
    if (!res.ok) return { ok: false, status: res.status, reason: `HTTP ${res.status}`, text };
    return { ok: true, status: res.status, json, text };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "fetch-failed";
    return { ok: false, status: 0, reason, text: "" };
  } finally {
    clearTimeout(t);
  }
}

function readEnvelopeStatus(json: unknown): "OK" | "ERROR" | undefined {
  if (json && typeof json === "object" && "status" in json) {
    const s = (json as { status?: unknown }).status;
    if (s === "OK") return "OK";
    if (s === "ERROR") return "ERROR";
  }
  return undefined;
}
function readEnvelopeMessage(json: unknown): string | undefined {
  if (json && typeof json === "object" && "message" in json) {
    const m = (json as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
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
  if (json && typeof json === "object") {
    const obj = json as { data?: unknown; response?: unknown };
    if (Array.isArray(obj.data)) return true;
    if (Array.isArray(obj.response)) return true;
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

export class OsclassUnsupportedOperationError extends Error {
  constructor(flavor: string, op: string) {
    super(`Flavor "${flavor}" does not implement operation "${op}"`);
    this.name = "OsclassUnsupportedOperationError";
  }
}

/**
 * Reference data (regions, countries, cities, categories, currencies)
 * changes rarely. Cache server-side for 1h via Next.js's revalidate hint
 * so repeated SSR navigations don't hammer Osclass.
 */
const REFERENCE_OPS: ReadonlySet<Operation["kind"]> = new Set([
  "listRegions",
  "listCountries",
  "listCities",
  "listCurrencies",
  "categoryTree",
]);

async function call(op: Operation): Promise<unknown> {
  const cfg = getOsclassConfig();
  if (!cfg) throw new OsclassNotConfiguredError();
  const flavor = await ensureFlavor(cfg);
  const built = flavor.build(op, cfg);
  if (!built) {
    throw new OsclassUnsupportedOperationError(flavor.id, op.kind);
  }
  const policy: FetchPolicy = REFERENCE_OPS.has(op.kind)
    ? { kind: "revalidate", seconds: 3600 }
    : { kind: "no-store" };
  const result = await fetchOnce(built, 10_000, policy);
  if (!result.ok) {
    if (flavorCache?.kind === "ok" && flavorCache.flavorId === flavor.id) {
      flavorCache = null;
    }
    throw new OsclassApiError(result.status, result.text || result.reason);
  }
  return result.json;
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const obj = payload as { data?: unknown; response?: unknown };
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.response)) return obj.response as T[];
  }
  return [];
}

function unwrapItem<T>(payload: unknown): T | undefined {
  if (!payload || typeof payload !== "object") return payload as T | undefined;
  const obj = payload as { data?: unknown; response?: unknown };
  // OsclassPoint: { status, response: <object|array> } — pick first if list,
  // otherwise the response object directly.
  if (Array.isArray(obj.response)) {
    return (obj.response[0] as T) ?? undefined;
  }
  if (obj.response && typeof obj.response === "object") {
    return obj.response as T;
  }
  if (obj.data && typeof obj.data === "object") {
    return obj.data as T;
  }
  return payload as T;
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
    const payload = await call({ kind: "listItems", ...params });
    return unwrapList<OsclassItem>(payload);
  },

  async getItem(id: string | number): Promise<OsclassItem | undefined> {
    try {
      const payload = await call({ kind: "getItem", id });
      const item = unwrapItem<OsclassItem>(payload);
      // Empty-but-OK envelope (response: []) for a missing id should be 404.
      if (!item || (typeof item === "object" && Object.keys(item as object).length === 0)) {
        return undefined;
      }
      return item;
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
    const payload = await call({ kind: "createItem", ...input });
    return unwrapItem<OsclassItem>(payload);
  },

  async listRegions(input: { countryCode?: string } = {}): Promise<OsclassRegion[]> {
    const payload = await call({ kind: "listRegions", ...input });
    return unwrapList<OsclassRegion>(payload);
  },

  async listCountries(): Promise<OsclassCountry[]> {
    const payload = await call({ kind: "listCountries" });
    return unwrapList<OsclassCountry>(payload);
  },

  async listCities(input: { regionId?: number | string } = {}): Promise<OsclassCity[]> {
    const payload = await call({ kind: "listCities", ...input });
    const all = unwrapList<OsclassCity>(payload);
    // The OsclassPoint plugin returns the full city list regardless of
    // regionId. Apply the filter on the client side.
    if (input.regionId === undefined) return all;
    const want = String(input.regionId);
    return all.filter((c) => String(c.fk_i_region_id ?? "") === want);
  },

  async listCurrencies(): Promise<OsclassCurrency[]> {
    const payload = await call({ kind: "listCurrencies" });
    return unwrapList<OsclassCurrency>(payload);
  },

  async categoryTree(): Promise<OsclassCategory[]> {
    const payload = await call({ kind: "categoryTree" });
    return unwrapList<OsclassCategory>(payload);
  },
};
