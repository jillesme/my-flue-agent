import { flue } from '@flue/runtime/routing';
import { Hono } from 'hono';
import type { WatchtowerDatabase, WatchtowerNewsRow, WatchtowerStatusRow } from './watchtower';

type Bindings = {
  WATCHTOWER_DB: WatchtowerDatabase;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (c) => c.json({ ok: true }));

app.get('/api/watchtower/news', async (c) => {
  const limitValue = Number(c.req.query('limit') ?? 8);
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(Math.floor(limitValue), 1), 20) : 8;
  const database = c.env.WATCHTOWER_DB;
  const [news, status] = await Promise.all([
    database
      .prepare(
        `SELECT id, headline, summary, source_title, source_url, published_at, first_seen_at, last_seen_at
         FROM watchtower_news
         ORDER BY
           CASE WHEN published_at IS NULL THEN 1 ELSE 0 END,
           published_at DESC,
           last_seen_at DESC,
           id DESC
         LIMIT ?`,
      )
      .bind(limit)
      .all<WatchtowerNewsRow>(),
    database
      .prepare(
        `SELECT last_refresh_at, last_refresh_status, stories_stored
         FROM watchtower_status
         WHERE id = 1`,
      )
      .first<WatchtowerStatusRow>(),
  ]);

  return c.json({
    news: news.results.map((story) => ({
      id: story.id,
      headline: story.headline,
      summary: story.summary,
      sourceTitle: story.source_title,
      sourceUrl: story.source_url,
      publishedAt: story.published_at,
      firstSeenAt: story.first_seen_at,
      lastSeenAt: story.last_seen_at,
    })),
    refreshedAt: status?.last_refresh_at ?? null,
    refreshStatus: status?.last_refresh_status ?? null,
    storiesStored: status?.stories_stored ?? 0,
  });
});

app.route('/api', flue());

export default app;
