type WatchtowerStatement = {
  bind(...values: unknown[]): WatchtowerStatement;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number; last_row_id: number } }>;
};

export type WatchtowerDatabase = {
  prepare(query: string): WatchtowerStatement;
};

export type WatchtowerNewsRow = {
  id: number;
  headline: string;
  summary: string;
  source_title: string;
  source_url: string;
  published_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

export type WatchtowerStatusRow = {
  last_refresh_at: string | null;
  last_refresh_status: string | null;
  stories_stored: number;
};

export const worldCupWindow = {
  starts: '2026-06-11',
  ends: '2026-07-19',
} as const;

export function isWorldCupWeekday(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const easternDate = `${values.year}-${values.month}-${values.day}`;

  return (
    values.weekday !== 'Sat' &&
    values.weekday !== 'Sun' &&
    easternDate >= worldCupWindow.starts &&
    easternDate <= worldCupWindow.ends
  );
}
