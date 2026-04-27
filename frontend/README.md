# Listrex frontend

Next.js (App Router) UI for browsing listings, viewing details with a contact form, auth placeholders, and a starter “list property” flow. Listing data is mocked until `NEXT_PUBLIC_API_URL` points at your API.

## Scripts

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
npm run lint
```

Copy `.env.example` to `.env.local` when you configure the backend.

## Routes (MVP)

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/listings` | Search (`?q=`) + grid |
| `/listings/[slug]` | Detail + contact sidebar |
| `/login`, `/register` | Auth placeholders |
| `/account/listings/new` | Create listing form placeholder |
