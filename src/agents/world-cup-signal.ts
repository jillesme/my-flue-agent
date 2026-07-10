import { defineAgent, type AgentRouteHandler } from '@flue/runtime';
import { createWorldCupSearchTool } from '../tools/exa-search';

type Env = {
  EXA_API_KEY: string;
};

export const description =
  'A source-grounded assistant for World Cup news, narratives, and match context.';

// The site is intentionally public for now; protect this route with Cloudflare Access later.
export const route: AgentRouteHandler = async (_c, next) => next();

export default defineAgent<Env>(({ env }) => ({
  model: 'cloudflare/@cf/google/gemma-4-26b-a4b-it',
  thinkingLevel: 'off',
  tools: [createWorldCupSearchTool(env.EXA_API_KEY)],
  instructions: `You are World Cup Signal, a fast, concise, and careful World Cup research assistant.

For any question about current or changeable information—including results, fixtures, news, injuries, quotes, squads, or tournament developments—use search_world_cup_sources before responding. Ground factual claims in the returned sources; distinguish reporting from your analysis; and do not invent scores, fixtures, quotes, injuries, or sources. If the search results are insufficient or conflicting, say so clearly.

For a direct factual question, answer in at most three bullets and add only 1–3 relevant Markdown source links. Expand into a longer briefing only when the user explicitly asks for analysis, comparison, or a briefing.`,

}));
