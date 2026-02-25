# Twitter Digest (Single-App Architecture)

One Next.js app on Vercel, no separate server required.

## Screenshots
![Twitter Digest Screenshot 1](public/td1.png)
![Twitter Digest Screenshot 2](public/td2.png)
![Twitter Digest Screenshot 3](public/td3.png)

## What It Does
- Default ingestion via Twitter/X API.
- Dedup by tweet ID (in-batch + against DB).
- Summarize only new tweets.
- Store digest history and tweet links in Postgres.
- Optional external worker ingestion, closed by default.

## Endpoints
- `GET /api/digests`
- `GET /api/digests/latest`
- `GET /api/digests/:id`
- `GET /api/config/status`
- `POST /api/config`
- `POST /api/cron/digest` (requires `CRON_SECRET`)
- `GET /api/worker/health` (optional, gated)
- `GET /api/worker/config` (optional, gated)
- `POST /api/worker/digests` (optional, gated)

## Required Environment Variables
- `DATABASE_URL` (managed Postgres)
- `CRON_SECRET` (auth for `/api/cron/digest`)

## Database Providers You Can Use Right Now (`DATABASE_URL`)
- `Neon` (recommended free tier path)
- `Supabase Postgres`
- `Railway Postgres`
- `Render Postgres`
- `Aiven Postgres`
- `Any self-hosted Postgres`

This app uses the `pg` driver, so any standard Postgres connection string works.

Quick example:
```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=verify-full
```

## Optional Environment Variables
- `DATABASE_SSL` (`false` for local dev; default uses TLS)
- `UI_THEME` (`x` or `twitter`, default `x`)
- `DATABASE_LABEL` (display label in Settings UI)
- `INGESTION_MODE` (`twitter_api` default, or `external_worker`)
- `TWITTER_BEARER_TOKEN`
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`
- `TWITTER_USER_ID`
- `TWITTER_USERNAME`
- `TWITTER_QUERY`
- `TWITTER_PULL_MODE` (`home_timeline`, `user_timeline`, or `search_query`)
- `TWITTER_MAX_RESULTS` (default `50`)
- `SUMMARIZER_PROVIDER` (`auto`, `openai`, `anthropic`)
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
- `SUMMARY_MAX_TOKENS`
- `WORKER_API_TOKEN` (required to enable worker endpoints)
- `WORKER_ALLOWED_IP` (required to enable worker endpoints)

Worker endpoints remain effectively closed unless both `WORKER_API_TOKEN` and allowed IP are configured.

## Local Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Scheduler Options (Free)
- Cloudflare Workers Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- GitHub Actions `schedule`: https://docs.github.com/actions/using-workflows/events-that-trigger-workflows#schedule
- cron-job.org HTTP scheduler: https://cron-job.org/en/
- If you deploy on Vercel, this repo already includes a `vercel.json` cron for `/api/cron/digest` every 3 hours.
