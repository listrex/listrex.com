# Listrex frontend

Next.js (App Router) UI for browsing listings, viewing details with a contact form, auth placeholders, and a starter "list property" flow.

The Next.js server doubles as the custom backend layer described in
[`docs/architecture.md`](../docs/architecture.md): server components and route
handlers under `/api/*` call the Osclass REST plugin with a secret key. The
browser never sees the Osclass API key or its URL.

```text
Browser  ──►  Next.js (server components + /api/*)  ──►  Osclass REST plugin  ──►  Osclass + MariaDB
```

## Scripts

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
npm run lint
```

## Connecting to Osclass

1. In Osclass admin, install/enable the REST API plugin and create a
   **read** API key (use a separate write key for any server-side mutations).
2. Copy `.env.example` to `.env.local` and fill in:
   - `OSCLASS_API_BASE_URL` — the plugin's base URL, e.g.
     `https://admin.listrex.com/index.php?page=api&action=v2`
   - `OSCLASS_API_KEY` — the read key from the plugin settings
   - `OSCLASS_DEFAULT_CATEGORY_ID` — *(optional)* restrict listings to a
     single Osclass category (find the id in admin → Categories)
   - `OSCLASS_PAGE_SIZE` — *(optional)* default page size, capped at 50
3. Restart `npm run dev`.

If `OSCLASS_API_BASE_URL` and `OSCLASS_API_KEY` are not set, the app falls
back to the built-in mock listings so UI work is never blocked.

### Diagnostics

`GET /api/osclass/health` reports whether Osclass is configured, the
configured host (no key leakage), and the result of one minimal upstream
call. Set `OSCLASS_DEBUG=1` on the server to also include the upstream
status code and a short body excerpt in error responses from
`/api/listings*` and `/api/osclass/health`. Leave it unset in normal
production traffic.

## Routes (MVP)

| Path                                  | Purpose                                              |
| ------------------------------------- | ---------------------------------------------------- |
| `/`                                   | Landing                                              |
| `/listings`                           | Search (`?q=`) + grid (server-rendered from Osclass) |
| `/listings/[slug]`                    | Detail + contact sidebar                             |
| `/login`, `/register`                 | Auth placeholders                                    |
| `/account/listings/new`               | Create listing form placeholder                      |
| `GET  /api/listings`                  | Search JSON: `?q=`, `?city=`, `?region=`, paging     |
| `GET  /api/listings/[slug]`           | Single listing JSON                                  |
| `POST /api/listings/[slug]/contact`   | Send a lead to the listing owner                     |

## Where the integration lives

- `src/lib/osclass/env.ts` — reads server-only env vars
- `src/lib/osclass/client.ts` — typed wrapper over the Osclass REST endpoints
- `src/lib/osclass/normalize.ts` — maps Osclass items to `Listing`
- `src/lib/data/listings.ts` — the single API used by pages + route handlers (auto-falls back to mocks)
- `src/app/api/listings/**` — public JSON surface for the browser/mobile

If your installed REST plugin uses different paths (e.g. `/api/v2/items`
instead of `?page=api&action=v2&route=items`), change the `endpoints` map at
the top of `src/lib/osclass/client.ts` only — callers stay the same.
