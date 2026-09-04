# Robotics Center Auth

Standalone authentication frontend for the Robotics Center product family:

- [roboticscenter.ai](https://www.roboticscenter.ai)
- [platform.roboticscenter.ai](https://platform.roboticscenter.ai)
- [centeros.roboticscenter.ai](https://centeros.roboticscenter.ai)

## Current phase

This repository is a frontend-only prototype. The forms deliberately prevent
submission and make no authentication or API requests. Supabase Auth, shared
sessions, OAuth, callback validation, and production redirects belong to Phase 2.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Preview routes

- `/` — sign in and sign up
- `/forgot-password` — password reset request
- `/update-password` — password update
- `/launcher` — post-login application chooser
- `/error` — safe authentication error state

## Deployment boundary

Deploy this repository as its own Vercel project and attach
`login.roboticscenter.ai` only after the frontend has been reviewed. Do not add
production Supabase secrets to the browser bundle. Server-only credentials must
remain in Vercel server environment variables when backend work begins.
