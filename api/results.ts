// GET /api/results?race=okc-2026&runner=christina
// Returns the full race archive row. Defaults to okc-2026/christina so the
// page can fetch with no query string today.

import { getArchive } from "../lib/race-archive";

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }
  const url = new URL(req.url);
  const raceSlug = url.searchParams.get("race") || "okc-2026";
  const runnerSlug = url.searchParams.get("runner") || "christina";

  try {
    const archive = await getArchive(raceSlug, runnerSlug);
    if (!archive) {
      return json({ error: "archive not found", raceSlug, runnerSlug }, 404);
    }
    return json(archive, 200, {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
    });
  } catch (err: any) {
    console.error("results GET error:", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
}

function json(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
