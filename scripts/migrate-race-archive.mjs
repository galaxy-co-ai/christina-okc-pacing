// Adds race_archives — one row per (race_slug, runner_slug). Holds the full
// post-race archive as JSONB so the Results sheet can render everything
// without losing any data we collected. Future races append rows; the
// race-builder UI (when we build it) will normalize specific concepts
// out of the JSONB blob into proper tables, which is a one-way migration
// JSONB makes easy.

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

if (!process.env.DATABASE_URL) {
  try {
    const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set (checked env + .env.local)');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log('Creating race_archives…');
await sql`
  create table if not exists race_archives (
    race_slug      text        not null,
    runner_slug    text        not null,
    race_name      text        not null,
    race_date      date,
    runner_name    text,
    headline_time  text,
    data           jsonb       not null default '{}'::jsonb,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    primary key (race_slug, runner_slug)
  )
`;

console.log('Creating race_archives index for listing by date…');
await sql`
  create index if not exists race_archives_race_date_idx
    on race_archives (race_date desc)
`;

const rows = await sql`select count(*)::int as count from race_archives`;
console.log(`race_archives rows: ${rows[0].count}`);
console.log('Done.');
