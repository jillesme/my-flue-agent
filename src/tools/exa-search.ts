import { defineTool } from '@flue/runtime';
import Exa from 'exa-js';
import * as v from 'valibot';

export function createWorldCupSearchTool(apiKey: string | undefined) {
  if (!apiKey) {
    throw new Error('EXA_API_KEY must be configured before World Cup Signal can search the web.');
  }

  const exa = new Exa(apiKey);

  return defineTool({
    name: 'search_world_cup_sources',
    description:
      'Search the web for current, sourceable World Cup reporting and context. Use this before answering questions about news, scores, fixtures, injuries, quotes, squads, or other facts that may have changed.',
    input: v.object({
      query: v.pipe(v.string(), v.minLength(3), v.maxLength(500)),
    }),
    output: v.object({
      requestId: v.string(),
      results: v.array(
        v.object({
          title: v.string(),
          url: v.string(),
          publishedDate: v.optional(v.string()),
          highlights: v.array(v.string()),
        }),
      ),
    }),
    async run({ input }) {
      const response = await exa.search(input.query, {
        type: 'auto',
        numResults: 3,
        contents: {
          highlights: { maxCharacters: 500 },
        },
      });

      return {
        requestId: response.requestId,
        results: response.results.map((result) => ({
          title: result.title ?? 'Untitled source',
          url: result.url,
          publishedDate: result.publishedDate,
          highlights: result.highlights ?? [],
        })),
      };
    },
  });
}
