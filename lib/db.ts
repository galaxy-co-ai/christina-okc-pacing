// Neon HTTP client + overlay persistence helpers.
// Edge-runtime compatible.

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type PaceOverrides = { [mile: string]: number };
export type MileBullet = { id: string; text: string };
export type MileBullets = { [mile: string]: MileBullet[] };
export type Forecast = { body: string; updatedAt: string } | null;
export type Reminder = { id: string; label: string; body: string };

export type Overlay = {
  paceOverrides: PaceOverrides;
  mileBullets: MileBullets;
  forecast: Forecast;
  reminders: Reminder[];
};

export type ChangeRow = {
  id: number;
  edit_id: string;
  tool: string;
  args: Record<string, unknown>;
  reason: string | null;
  reverted_at: string | null;
  created_at: string;
};

const EDIT_ID = "christina";

let cached: NeonQueryFunction<false, false> | null = null;
function sql() {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    cached = neon(url);
  }
  return cached;
}

function emptyOverlay(): Overlay {
  return { paceOverrides: {}, mileBullets: {}, forecast: null, reminders: [] };
}

export async function getOverlay(): Promise<Overlay> {
  const rows =
    (await sql()`select data from plan_edits where id = ${EDIT_ID}`) as {
      data: Overlay;
    }[];
  const raw = rows[0]?.data;
  if (!raw || typeof raw !== "object") return emptyOverlay();
  return {
    paceOverrides: raw.paceOverrides ?? {},
    mileBullets: raw.mileBullets ?? {},
    forecast: raw.forecast ?? null,
    reminders: raw.reminders ?? [],
  };
}

export async function saveOverlay(data: Overlay): Promise<void> {
  await sql()`
    insert into plan_edits (id, data, updated_at)
    values (${EDIT_ID}, ${JSON.stringify(data)}::jsonb, now())
    on conflict (id) do update set data = excluded.data, updated_at = now()
  `;
}

export async function appendChange(
  tool: string,
  args: Record<string, unknown>,
  reason: string,
): Promise<number> {
  const rows = (await sql()`
    insert into plan_changes (edit_id, tool, args, reason)
    values (${EDIT_ID}, ${tool}, ${JSON.stringify(args)}::jsonb, ${reason})
    returning id
  `) as { id: number }[];
  return rows[0].id;
}

export async function listChanges(limit = 30): Promise<ChangeRow[]> {
  return (await sql()`
    select id, edit_id, tool, args, reason, reverted_at, created_at
    from plan_changes
    where edit_id = ${EDIT_ID}
    order by created_at desc
    limit ${limit}
  `) as ChangeRow[];
}

export async function markReverted(id: number): Promise<void> {
  await sql()`update plan_changes set reverted_at = now() where id = ${id}`;
}

export async function getChange(id: number): Promise<ChangeRow | null> {
  const rows = (await sql()`
    select id, edit_id, tool, args, reason, reverted_at, created_at
    from plan_changes where id = ${id}
  `) as ChangeRow[];
  return rows[0] ?? null;
}
