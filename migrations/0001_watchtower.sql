CREATE TABLE IF NOT EXISTS watchtower_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_title TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  published_at TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS watchtower_news_latest_idx
  ON watchtower_news(last_seen_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS watchtower_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_refresh_at TEXT,
  last_refresh_status TEXT,
  stories_stored INTEGER NOT NULL DEFAULT 0
);
