# Robotics Center Auth

Standalone authentication frontend for the Robotics Center product family:

- [roboticscenter.ai](https://www.roboticscenter.ai)
- [platform.roboticscenter.ai](https://platform.roboticscenter.ai)
- [centeros.roboticscenter.ai](https://centeros.roboticscenter.ai)

## Current phase

The `codex/central-auth-integration` branch connects the portal UI to the same
Supabase Auth project as the website. It implements email/password sign in,
signup, Google, password recovery, password updates, server-side callbacks,
logout, and the Supabase OAuth 2.1 consent UI.

OAuth clients and callback destinations are deny-by-default. A client must be
present in both `AUTH_ALLOWED_OAUTH_CLIENT_IDS` and
`AUTH_ALLOWED_OAUTH_REDIRECT_URIS` before the portal will approve it.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` — sign in and sign up
- `/forgot-password` — password reset request
- `/update-password` — password update
- `/launcher` — post-login application chooser
- `/error` — safe authentication error state
- `/auth/callback` — Supabase login/recovery callback
- `/oauth/consent` — first-party OAuth authorization screen
- `/logout` — global portal signout with allowlisted return

## Deployment boundary

Deploy this branch only as a Vercel Preview until the website Preview test
matrix passes. Do not move `login.roboticscenter.ai`, change the Supabase Site
URL, or enable this flow in the website Production environment during Preview
testing. Only the public Supabase URL and anon/publishable key belong in the
browser bundle; OAuth client secrets stay in the website's server-only Vercel
environment.
