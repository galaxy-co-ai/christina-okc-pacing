// GET  /api/plan — public read of Christina's current overlay + recent change log.
// POST /api/plan — body { action: "revert", changeId } reverts a change by id.
//
// GET response shape:
//   { overlay: Overlay, changes: ChangeRow[] }   // newest first, up to 30
// POST response shape:
//   { ok: boolean, error?: string, overlay?: Overlay, changes?: ChangeRow[] }
//
// The revert POST is public on purpose — only the coach endpoint can *create*
// changes, so the worst an anonymous caller can do is undo existing changes.
// Full history survives in plan_changes; nothing is destructive.

import {
  appendChange,
  getChange,
  getOverlay,
  listChanges,
  markReverted,
  saveOverlay,
} from "../lib/db";
import type { Overlay } from "../lib/db";

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "GET") return handleGet();
  if (req.method === "POST") return handlePost(req);
  return json({ error: "Method not allowed" }, 405);
}

async function handleGet(): Promise<Response> {
  try {
    const [overlay, changes] = await Promise.all([
      getOverlay(),
      listChanges(30),
    ]);
    return json({ overlay, changes }, 200, {
      "Cache-Control": "no-store, max-age=0",
    });
  } catch (err: any) {
    console.error("plan GET error:", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
}

async function handlePost(req: Request): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid JSON" }, 400);
  }

  if (body?.action !== "revert") {
    return json({ ok: false, error: "unsupported action" }, 400);
  }
  const changeId = Number(body.changeId);
  if (!Number.isInteger(changeId)) {
    return json({ ok: false, error: "changeId must be an integer" }, 400);
  }

  try {
    const change = await getChange(changeId);
    if (!change) return json({ ok: false, error: "change not found" }, 404);
    if (change.reverted_at)
      return json({ ok: false, error: "already reverted" }, 409);

    const overlay = await getOverlay();
    const result = revertInOverlay(change, overlay);
    if (!result.ok) return json(result, 422);

    await saveOverlay(overlay);
    await markReverted(changeId);
    await appendChange(
      "revert_change",
      { revertedChangeId: changeId },
      "User tapped undo",
    );

    const [freshOverlay, freshChanges] = await Promise.all([
      getOverlay(),
      listChanges(30),
    ]);
    return json(
      { ok: true, overlay: freshOverlay, changes: freshChanges },
      200,
    );
  } catch (err: any) {
    console.error("plan POST error:", err);
    return json({ ok: false, error: err?.message || "Internal error" }, 500);
  }
}

function revertInOverlay(
  change: { tool: string; args: Record<string, unknown> },
  overlay: Overlay,
): { ok: true } | { ok: false; error: string } {
  const { tool, args } = change;
  switch (tool) {
    case "set_mile_pace": {
      const mile = String((args as { mile: number }).mile);
      delete overlay.paceOverrides[mile];
      return { ok: true };
    }
    case "add_mile_bullet": {
      const mile = String((args as { mile: number }).mile);
      const bulletId = (args as { bullet: { id: string } }).bullet?.id;
      const list = overlay.mileBullets[mile] ?? [];
      const next = list.filter((b) => b.id !== bulletId);
      if (next.length === 0) delete overlay.mileBullets[mile];
      else overlay.mileBullets[mile] = next;
      return { ok: true };
    }
    case "add_reminder": {
      const id = (args as { reminder: { id: string } }).reminder?.id;
      overlay.reminders = overlay.reminders.filter((r) => r.id !== id);
      return { ok: true };
    }
    case "add_fuel_point": {
      const mile = (args as { mile: number }).mile;
      overlay.fuelSchedule = (overlay.fuelSchedule ?? []).filter(
        (m) => Math.abs(m - mile) >= 0.05,
      );
      return { ok: true };
    }
    case "set_fuel_schedule": {
      const prior = (args as { prior: number[] }).prior;
      overlay.fuelSchedule = Array.isArray(prior) ? prior.slice() : [];
      return { ok: true };
    }
    case "remove_fuel_point":
      return {
        ok: false,
        error: "cannot revert a remove_fuel_point — use add_fuel_point to restore",
      };
    case "remove_mile_bullet":
      return {
        ok: false,
        error: "cannot revert a remove_mile_bullet (no snapshot)",
      };
    case "update_forecast":
      return {
        ok: false,
        error:
          "cannot revert forecast updates — use update_forecast to replace",
      };
    default:
      return { ok: false, error: `cannot revert tool: ${tool}` };
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
