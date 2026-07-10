import { defineTool } from '@flue/runtime';
import * as v from 'valibot';
import type { WatchtowerDatabase } from '../watchtower';

export function createWatchtowerStoreTool(database: WatchtowerDatabase, refreshedAt: string) {
  return defineTool({
    name: 'store_watchtower_story',
    description:
      'Save one significant, source-backed World Cup development to the public Watchtower. Call this once for every story worth showing readers after researching it. Do not store speculation, duplicate links, or unsupported claims.',
    input: v.object({
      headline: v.pipe(v.string(), v.minLength(8), v.maxLength(180)),
      summary: v.pipe(v.string(), v.minLength(20), v.maxLength(500)),
      sourceTitle: v.pipe(v.string(), v.minLength(3), v.maxLength(300)),
      sourceUrl: v.pipe(v.string(), v.minLength(10), v.maxLength(2_048)),
      publishedAt: v.optional(v.pipe(v.string(), v.maxLength(100))),
    }),
    output: v.object({ stored: v.boolean() }),
    async run({ input }) {
      await database
        .prepare(
          `INSERT INTO watchtower_news (
            headline, summary, source_title, source_url, published_at, first_seen_at, last_seen_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(source_url) DO UPDATE SET
            headline = excluded.headline,
            summary = excluded.summary,
            source_title = excluded.source_title,
            published_at = COALESCE(excluded.published_at, watchtower_news.published_at),
            last_seen_at = excluded.last_seen_at`,
        )
        .bind(
          input.headline,
          input.summary,
          input.sourceTitle,
          input.sourceUrl,
          input.publishedAt ?? null,
          refreshedAt,
          refreshedAt,
        )
        .run();

      await database
        .prepare(
          `INSERT INTO watchtower_status (id, last_refresh_at, last_refresh_status, stories_stored)
           VALUES (1, ?, 'updated', 1)
           ON CONFLICT(id) DO UPDATE SET
             last_refresh_at = excluded.last_refresh_at,
             last_refresh_status = excluded.last_refresh_status,
             stories_stored = CASE
               WHEN watchtower_status.last_refresh_at = excluded.last_refresh_at
                 THEN watchtower_status.stories_stored + 1
               ELSE 1
             END`,
        )
        .bind(refreshedAt)
        .run();

      return { stored: true };
    },
  });
}

export function createWatchtowerRefreshStatusTool(
  database: WatchtowerDatabase,
  refreshedAt: string,
) {
  return defineTool({
    name: 'complete_watchtower_refresh',
    description:
      'Mark the scheduled Watchtower refresh complete only after you have researched current reporting and stored every significant source-backed story.',
    input: v.object({
      storiesStored: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(8)),
    }),
    output: v.object({ completed: v.boolean() }),
    async run({ input }) {
      await database
        .prepare(
          `INSERT INTO watchtower_status (id, last_refresh_at, last_refresh_status, stories_stored)
           VALUES (1, ?, 'complete', ?)
           ON CONFLICT(id) DO UPDATE SET
             last_refresh_at = excluded.last_refresh_at,
             last_refresh_status = excluded.last_refresh_status,
             stories_stored = excluded.stories_stored`,
        )
        .bind(refreshedAt, input.storiesStored)
        .run();

      return { completed: true };
    },
  });
}
