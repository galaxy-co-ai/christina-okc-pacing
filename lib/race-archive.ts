// Read-only access to race_archives. Edge-runtime compatible.
//
// Schema is intentionally JSONB-heavy: the post-race archive captures
// dozens of related-but-loosely-typed concepts (segments, phases,
// predictions, crew log, training context). When the race-builder UI
// is built, specific concepts (plans, checkpoints) will be normalized
// out of the blob into proper tables — JSONB makes that one-way
// migration easy.

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cached: NeonQueryFunction<false, false> | null = null;
function sql() {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    cached = neon(url);
  }
  return cached;
}

export type RaceArchiveRow = {
  raceSlug: string;
  runnerSlug: string;
  raceName: string;
  raceDate: string | null;
  runnerName: string | null;
  headlineTime: string | null;
  data: Record<string, unknown>;
  updatedAt: string;
};

export async function getArchive(
  raceSlug: string,
  runnerSlug: string,
): Promise<RaceArchiveRow | null> {
  const rows = (await sql()`
    select race_slug, runner_slug, race_name, race_date, runner_name,
           headline_time, data, updated_at
    from race_archives
    where race_slug = ${raceSlug} and runner_slug = ${runnerSlug}
    limit 1
  `) as Array<{
    race_slug: string;
    runner_slug: string;
    race_name: string;
    race_date: string | null;
    runner_name: string | null;
    headline_time: string | null;
    data: Record<string, unknown>;
    updated_at: string;
  }>;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    raceSlug: r.race_slug,
    runnerSlug: r.runner_slug,
    raceName: r.race_name,
    raceDate: r.race_date,
    runnerName: r.runner_name,
    headlineTime: r.headline_time,
    data: r.data ?? {},
    updatedAt: r.updated_at,
  };
}
