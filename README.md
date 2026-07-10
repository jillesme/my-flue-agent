# World Cup Signal

A Flue agent deployed on Cloudflare Workers, designed to turn current World Cup reporting into concise, source-grounded briefings.

## Stack

- Flue agent sessions backed by Cloudflare Durable Objects
- Cloudflare Workers AI: `@cf/zai-org/glm-5.2`
- Exa web research (to be added after Exa Dashboard Onboarding)

## Development

```bash
npm run dev
```

The worker exposes `GET /health`. Once the agent has an authenticated public route, it will expose a World Cup Signal endpoint as well.

## Exa setup

Exa asks new integrations to begin with [Dashboard Onboarding](https://dashboard.exa.ai/onboarding), which generates a tested Cloudflare/TypeScript snippet for the selected use case. Use it to create the integration snippet, then add the returned `EXA_API_KEY` to `.dev.vars` for local Cloudflare development:

```dotenv
EXA_API_KEY="your-key"
```

Do not commit `.dev.vars`. For deployment, configure the key with:

```bash
npx wrangler secret put EXA_API_KEY
```
