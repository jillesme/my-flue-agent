import { defineAgent, defineWorkflow } from '@flue/runtime';
import * as v from 'valibot';
import { createWorldCupSearchTool } from '../tools/exa-search';
import {
  createWatchtowerRefreshStatusTool,
  createWatchtowerStoreTool,
} from '../tools/watchtower-store';
import type { WatchtowerDatabase } from '../watchtower';

type Env = {
  EXA_API_KEY: string;
  WATCHTOWER_DB: WatchtowerDatabase;
};

const RefreshOutput = v.object({
  storiesStored: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(8)),
  note: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
});

const watchtowerEditor = defineAgent<Env>(({ env }) => ({
  model: 'cloudflare/@cf/google/gemma-4-26b-a4b-it',
  thinkingLevel: 'off',
  tools: [
    createWorldCupSearchTool(env.EXA_API_KEY, { numResults: 8 }),
    createWatchtowerStoreTool(env.WATCHTOWER_DB, new Date().toISOString()),
    createWatchtowerRefreshStatusTool(env.WATCHTOWER_DB, new Date().toISOString()),
  ],
  instructions: `You are the World Cup Signal Watchtower editor. Your job is to maintain a small public list of material, current World Cup developments.

Always search before deciding what to publish. Store only clearly source-backed developments that would matter to a reader: results, official fixture or squad changes, confirmed injuries, major official announcements, or consequential quotes. Reject routine previews, speculation, duplicate links, and unsupported claims. For every story you select, call store_watchtower_story with a concise neutral headline, a 1–2 sentence summary, and the exact supporting source URL from search results. Store no more than five stories in one refresh. When finished, call complete_watchtower_refresh, then return the requested structured result.`,
}));

export default defineWorkflow({
  agent: watchtowerEditor,
  input: v.object({
    scheduledAt: v.string(),
  }),
  output: RefreshOutput,
  async run({ harness, input }) {
    const response = await (await harness.session()).prompt(
      `Run the scheduled World Cup Watchtower refresh for ${input.scheduledAt}.

Search for the latest material reporting on the 2026 FIFA World Cup. Prefer reporting published recently, but do not invent publication dates. Save up to five distinct, significant stories. If current reporting is thin, save fewer stories or none. Complete the refresh only after storing the selected stories.`,
      { result: RefreshOutput },
    );

    return response.data;
  },
});
