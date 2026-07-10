# World Cup Signal

A Flue agent deployed on Cloudflare Workers, designed to turn current World Cup reporting into concise, source-grounded briefings.

## Stack

- Flue agent sessions backed by Cloudflare Durable Objects
- Cloudflare Workers AI: `@cf/zai-org/glm-5.2`
- Exa web research, exposed as a bounded agent tool

## Development

```bash
npm run dev
```

The worker exposes `GET /health`. Once the agent has an authenticated public route, it will expose a World Cup Signal endpoint as well.

## Exa setup

The agent uses Exa's `/search` API in `auto` mode with five results and token-efficient highlights. Add your key to the project-root `.env` (or `.dev.vars` for Cloudflare development):

```dotenv
EXA_API_KEY="your-key"
```

Do not commit either file. For deployment, configure the key with:

```bash
npx wrangler secret put EXA_API_KEY
```
