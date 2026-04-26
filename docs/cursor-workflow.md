# Cursor Workflow for This Project

Use Cursor as the product and engineering workspace for the app. Keep decisions, server notes, and build tasks in Markdown so future agents can continue without guessing.

## Recommended repo structure

```text
/
  README.md
  docs/
    architecture.md
    linode-deployment.md
    cursor-workflow.md
  frontend/              # future Next.js app
  backend/               # future API proxy
  osclass-custom/         # future custom Osclass plugin/theme code only
```

Do not commit purchased vendor plugins unless the license allows it. Keep purchased Osclass plugins on the server or in a private artifact store.

## How to use Cursor step by step

### 1. Keep requirements in docs

Start with:

- target country/city
- sale/rent categories
- required property fields
- payment model
- languages
- admin/moderation rules

Add these to `docs/architecture.md` as decisions are made.

### 2. Ask Cursor for small implementation tasks

Good tasks:

- "Create a Next.js frontend skeleton for property search."
- "Create a Node API proxy endpoint for listing search."
- "Add JWT auth to the backend API."
- "Write Osclass API client wrapper for search and listing details."
- "Create a deployment checklist for the backend service."

Avoid vague tasks like:

- "Build the whole app."
- "Make it modern."

### 3. Build in layers

Suggested order:

1. Deploy Osclass on Linode.
2. Install and configure the REST API plugin.
3. Create read-only API key for search/listings.
4. Build backend proxy with only read endpoints.
5. Build frontend property search and detail pages.
6. Add login/register.
7. Add create listing flow.
8. Add favorites/messages/payments.

### 4. Keep API keys out of frontend code

Never put Osclass REST plugin keys in:

- React components
- Next.js public environment variables
- mobile app code
- committed config files

Use backend-only environment variables:

```text
OSCLASS_BASE_URL=https://admin.example.com
OSCLASS_REST_KEY_READ=...
OSCLASS_REST_KEY_WRITE=...
```

### 5. Ask Cursor to maintain docs after changes

After each feature, ask:

```text
Update the docs to reflect the new backend endpoints and deployment steps.
```

This keeps future work easier.

## Useful Cursor prompts

### Architecture prompt

```text
Review docs/architecture.md and propose the smallest next implementation step for a real-estate classified MVP using Osclass as the backend engine.
```

### Backend prompt

```text
Create a backend API proxy that hides the Osclass REST plugin key. Start with GET /listings, GET /listings/:id, GET /categories, and GET /locations. Add validation and pagination limits.
```

### Frontend prompt

```text
Create a modern real-estate search UI with filters for location, price, bedrooms, property type, and map/list toggle. Use the backend API, not the Osclass REST URL directly.
```

### Security prompt

```text
Review the backend API for security issues: exposed secrets, ownership checks, rate limits, validation, and dangerous write/delete operations.
```

### Deployment prompt

```text
Create production deployment scripts for the backend service on the Linode VPS using systemd, Nginx reverse proxy, and environment variables.
```

## First MVP build checklist

- [ ] Linode server created
- [ ] Domain DNS configured
- [ ] Nginx installed
- [ ] PHP installed
- [ ] MariaDB installed
- [ ] Osclass installed
- [ ] REST API plugin installed
- [ ] Read-only API key created
- [ ] Write/delete keys kept private
- [ ] Backend proxy created
- [ ] Frontend created
- [ ] SSL enabled
- [ ] Backups enabled
- [ ] Basic monitoring enabled

