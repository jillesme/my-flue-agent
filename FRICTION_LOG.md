# Friction Log

A running record of issues, observations, and unresolved questions while building World Cup Signal.

## Setup and configuration

- **Workers AI provider naming was easy to confuse.** For a Cloudflare-target Flue project, the native binding-backed model form is `cloudflare/<Workers AI model ID>`, for example `cloudflare/@cf/google/gemma-4-26b-a4b-it`. The separate `cloudflare-workers-ai/...` provider is URL-backed and is not the intended path for this Worker.
- **Exa required an onboarding step before implementation.** The project used Exa Dashboard Onboarding and then the canonical coding-agent reference before adding the integration.
- **Secrets must use Worker runtime configuration.** `.env` works for this local project because no `.dev.vars` file exists; neither file is committed. A deployed Worker must receive `EXA_API_KEY` through `wrangler secret put EXA_API_KEY`.
- **The project currently has npm and pnpm lockfiles.** The initial setup used npm and created `package-lock.json`; later `pnpm run` created `pnpm-lock.yaml` and `pnpm-workspace.yaml`. Choose one package manager before committing or deploying so dependency resolution is reproducible.

## Local development and invocation

- **`flue run` starts a fresh temporary Cloudflare/workerd runtime for every prompt.** This adds startup cost and prints the remote AI binding warning. It does not attach to an already-running `flue dev` server unless an explicit `--server` path or URL is used.
- **The current agent intentionally has no public `route` export.** That makes `flue run` convenient for local testing, but prevents directly prompting the persistent `flue dev` server or a deployed Worker until we design and protect an HTTP access surface.
- **Concurrent build and run commands can race.** One parallel test produced `agent_not_found` because a build was rewriting generated output while `flue run` was starting. Run builds and agent prompts sequentially.
- **Multiple workerd processes may be visible during debugging.** One is the long-running dev server and another belongs to a temporary `flue run` invocation. Do not kill the dev server when cancelling a hung one-off prompt; cancel the `flue run` terminal with `Ctrl-C`.

## Frontend

- **Discovered agents are not HTTP-public by default.** The browser client requires an `AgentRouteHandler` export from `world-cup-signal.ts`; it now exposes the agent under `/api/agents/world-cup-signal/:conversationId`. The route is intentionally unauthenticated until Cloudflare Access or another control is added.
- **Each browser needs a distinct agent instance ID.** The React client persists a random UUID in `localStorage`; a fixed ID would make every visitor share one durable transcript and queue. The **New conversation** control creates a fresh UUID without deleting the old durable record.
- **Use Flue's React client rather than implementing Durable Streams.** `@flue/react` restores durable history, follows SSE updates, and reconnects with the correct stream offsets. This is especially useful because source-grounded answers routinely take longer than a normal single model response.
- **The projected transcript can include tool-only or reasoning-only assistant messages.** Rendering every assistant envelope produced blank rows after a tool completed, because the UI intentionally hides tool payloads. The client now renders only messages with non-empty text parts; the submission status remains the visible research-progress signal.
- **Flue beta.9's production config omits source `assets` settings.** `flue build` preserves `dist/client` but leaves `assets` out of `dist/<worker>/wrangler.json`, even though `.flue-vite.wrangler.jsonc` includes it. `scripts/add-assets-to-worker-config.mjs` restores the relative asset directory and Worker-first API routes after every build; `wrangler deploy --dry-run` confirmed all four client files are included.
- **Local frontend development uses two servers.** Run `pnpm dev` for the Worker on port 3583 and `pnpm dev:client` for Vite on port 5173. Vite proxies `/api` to the Worker. `flue dev` alone serves the API but did not serve the static client root in this setup.

## Retrieval and response quality

- **An Exa-backed response requires two model turns.** The first model call decides to use the tool; Exa searches; the second model call synthesizes the source-backed answer. This is necessary agent-loop overhead for the current design.
- **The original Exa payload was too large for quick factual answers.** The tool was tightened from five results with unconstrained highlights to three results with 500 highlight characters per result.
- **Instructions now request concise factual answers.** Simple queries should return at most three bullets and one to three source links. Longer analysis is opt-in.
- **The model should not infer facts from the question.** It must use Exa for current results, fixtures, injuries, quotes, and similar changeable claims, then cite returned URLs.

## Model latency experiments

- **GLM 5.2 completed a source-backed scorer query in about 45 seconds.** It is a capable agentic coding model but not optimized for this short retrieval-and-answer interaction.
- **GLM 4.7 Flash was materially worse in this tool loop.** The France–Morocco query paused for several minutes after `search_world_cup_sources` had completed, then eventually returned. The delay was therefore in the model’s post-tool completion, not Exa or Worker startup.
- **`thinkingLevel: 'minimal'` did not prevent the GLM 4.7 Flash delay.** Workers AI/provider support for this mapping needs to be treated as model-specific rather than assumed.
- **Current trial:** Gemma 4 26B A4B IT with `thinkingLevel: 'off'`. It supports function calling, has a 256K context window, and is priced at $0.10/M input and $0.30/M output. Its practical latency and tool-use reliability are still to be measured.

## Observability gap

- **The existing trace identifies the phase but not per-phase durations.** When a run stalls after `tool done`, the model’s final completion is implicated, but we cannot distinguish provider queueing from model reasoning/generation precisely.
- **Next observability option:** inspect the default Cloudflare AI Gateway request logs, which Flue enables for `cloudflare/...` models. Add application telemetry only if those logs do not provide enough timing detail.
