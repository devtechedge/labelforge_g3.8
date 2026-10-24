# Deployment

LabelForge is hosted on Vercel with a git-connected project. This page
describes how the deployment is wired and how to reproduce it.

## Live environment

| Item | Value |
| ---- | ----- |
| Production alias | https://labelforge-iota.vercel.app |
| Vercel project | labelforge (team Devtechedge) |
| Framework preset | Next.js |
| Node version | 22+ (set via `engines` in package.json) |

## Demo data behavior

The hosted app runs in demo mode:

- `VERCEL` is defined during builds and at runtime, so the database path
  resolver (`lib/db/path.ts`) points at an ephemeral `/tmp` SQLite database.
- The database is re-seeded on every cold start with the demo workspace.
- Writes (annotations, imports, releases) work during a session but may not
  survive instance recycling. The README states this honestly.
- Local development uses `data/labelforge.db` and persists.

## Repository configuration

`vercel.json` pins the framework preset and build commands so the project
settings cannot silently drift to a static-only build. If the project is
ever recreated, re-apply this file.

The Vercel project is linked to this GitHub repo with `main` configured as
the production branch (verified in project settings via API). Merging a pull
request or pushing to `main` triggers a production deployment automatically;
pull requests get preview deployments.

Two limitations observed on the Hobby plan:

- Vercel's free tier caps deployment creations at 100 per day
  (`api-deployments-free-per-day`). When the cap is hit, both manual
  `vercel --prod` uploads and git-triggered deploys are rejected until it
  resets. Re-run `vercel --prod` the next day if a push did not promote.
- Keep `gitProviderOptions.createDeployments` set to `enabled` (restore via
  project PATCH: `{"gitProviderOptions":{"createDeployments":"enabled"}}`).

## Security notes

- Vercel Authentication (SSO protection) must stay disabled for the public
  demo. It was observed to lock every route behind a Vercel login screen
  when enabled; disable it in project settings if it ever comes back.
- No secrets are stored in the repo. The deployment holds no API keys.
- See SECURITY.md for the threat model and residual risks.

## Verify after deploy

```bash
curl -I https://labelforge-iota.vercel.app
curl https://labelforge-iota.vercel.app/api/auth/current
curl https://labelforge-iota.vercel.app/api/workspaces/ws_core
```

All should return 200. The API responses must be JSON, not HTML.
