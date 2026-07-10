# World Cup Signal

A source-grounded World Cup research assistant deployed on Cloudflare Workers. It turns current reporting into concise briefings with links to the supporting sources.

## Stack

- React chat frontend served as static assets by the same Cloudflare Worker
- Flue agent sessions backed by Cloudflare Durable Objects
- Cloudflare Workers AI: `@cf/google/gemma-4-26b-a4b-it`
- Exa web research, exposed as a bounded agent tool

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

The Worker exposes `GET /health` and the public agent API at:

```text
/api/agents/world-cup-signal/:conversationId
```

The frontend assigns each browser a random, locally stored conversation ID. **New conversation** starts a separate agent session. The endpoint is intentionally public for now; put it behind Cloudflare Access or another authorization/rate-limiting layer before broader release.

## Build and deploy

```bash
pnpm build
npx wrangler deploy --config dist/my_flue_agent/wrangler.json
```

`pnpm build` builds the client to `dist/client` first, then builds the Flue Worker. The Worker configuration serves the client as a single-page application and sends `/api/*` and `/health` to Hono.

## Exa setup

The agent uses Exa's `/search` API in `auto` mode with three results and token-efficient highlights. Add your key to the project-root `.env` (or `.dev.vars` for Cloudflare development):

```dotenv
EXA_API_KEY="your-key"
```

Do not commit either file. For deployment, configure the key with:

```bash
npx wrangler secret put EXA_API_KEY
```
