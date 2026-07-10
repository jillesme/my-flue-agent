# World Cup Signal

A source-grounded World Cup research assistant deployed on Cloudflare Workers. It turns current reporting into concise briefings with links to the supporting sources.

## Stack

- React chat frontend served as static assets by the same Cloudflare Worker
- Flue agent sessions backed by Cloudflare Durable Objects
- Cloudflare Workers AI: `@cf/google/gemma-4-26b-a4b-it`
- Exa web research, exposed as bounded agent tools
- A D1-backed **Watchtower** of current, source-linked news
- A Flue workflow admitted by a Cloudflare Cron Trigger every 30 minutes

## Development

Start the Worker API in one terminal:

```bash
pnpm dev
```

Start the Vite frontend in another terminal:

```bash
pnpm dev:client
```

Open the Vite URL (normally `http://localhost:5173`). It proxies `/api` requests to the local Flue Worker on port 3583.

The Worker exposes `GET /health`, a public Watchtower feed, and the public agent API:

```text
/api/watchtower/news
/api/agents/world-cup-signal/:conversationId
```

The Watchtower feed is stored in D1. Its scheduled Flue workflow runs every 30 minutes only when the date is within the 2026 tournament window (June 11–July 19) and it is a weekday in `America/New_York`. The Cloudflare cron itself remains simple (`*/30 * * * *`, in UTC); the Worker applies the editorial window correctly across daylight saving time.

The frontend assigns each browser a random, locally stored conversation ID. **New conversation** starts a separate agent session. The endpoint is intentionally public for now; put it behind Cloudflare Access or another authorization/rate-limiting layer before broader release.

## Build and deploy

Apply D1 migrations once per environment, then build and deploy:

```bash
pnpm exec wrangler d1 migrations apply world-cup-signal-news --remote
pnpm build
npx wrangler deploy --config dist/my_flue_agent/wrangler.json
```

`pnpm build` builds the client to `dist/client` first, then builds the Flue Worker. The Worker configuration serves the client as a single-page application and sends `/api/*` and `/health` to Hono. The deployed Worker is available at `https://my-flue-agent.jillescf.workers.dev`.

## Exa setup

The agent uses Exa's `/search` API in `auto` mode with three results and token-efficient highlights. Add your key to the project-root `.env` (or `.dev.vars` for Cloudflare development):

```dotenv
EXA_API_KEY="your-key"
```

Do not commit either file. For deployment, configure the key with:

```bash
npx wrangler secret put EXA_API_KEY
```
