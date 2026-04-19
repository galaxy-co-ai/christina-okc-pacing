import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

// Load DATABASE_URL from .env.local if not in env
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

console.log('Creating plan_edits…');
await sql`
  create table if not exists plan_edits (
    id          text primary key,
    data        jsonb not null default '{}'::jsonb,
    updated_at  timestamptz not null default now()
  )
`;

console.log('Creating plan_changes…');
await sql`
  create table if not exists plan_changes (
    id          bigserial primary key,
    edit_id     text not null,
    tool        text not null,
    args        jsonb not null,
    reason      text,
    reverted_at timestamptz,
    created_at  timestamptz not null default now()
  )
`;

console.log('Creating plan_changes index…');
await sql`
  create index if not exists plan_changes_edit_id_created_at_idx
    on plan_changes (edit_id, created_at desc)
`;

console.log('Seeding christina row if missing…');
await sql`
  insert into plan_edits (id, data)
  values ('christina', '{}'::jsonb)
  on conflict (id) do nothing
`;

const [row] = await sql`select id, jsonb_typeof(data) as t, updated_at from plan_edits where id = 'christina'`;
console.log('christina row:', row);

const [{ count }] = await sql`select count(*)::int as count from plan_changes`;
console.log(`plan_changes rows: ${count}`);

console.log('Done.');
