# Real-Estate Classifieds Architecture

This project uses Osclass as the classifieds engine and admin system, with a modern app layer in front of it.

## Recommended architecture

```text
Web or mobile client
  -> custom backend API
    -> Osclass REST plugin
      -> Osclass
        -> MariaDB/MySQL
```

## Why this setup

The Osclass REST plugin is useful as a private bridge into Osclass, but it should not be called directly from a public frontend. The plugin uses shared API keys and does not provide user-level authorization for every action.

The custom backend API should:

- keep Osclass API keys secret
- authenticate users with sessions or JWT
- check listing ownership before edit/delete actions
- rate-limit public requests
- normalize Osclass responses for the frontend
- cap search result sizes
- expose only the routes the app actually needs

## Suggested domains

```text
app.example.com      Modern frontend
api.example.com      Custom backend API
admin.example.com    Osclass admin and REST plugin
```

## MVP components

Start with:

- Osclass core
- REST API plugin
- real-estate categories and custom fields
- listing search
- listing details
- user registration/login through the custom backend
- listing create/edit flow
- contact/lead form
- admin moderation

Add later:

- payments or featured listings
- agent profiles
- saved searches
- alerts
- chat
- recommendations
- mobile apps
