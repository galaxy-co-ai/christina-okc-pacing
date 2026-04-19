// Coach tool definitions, validators, and executors.
// Each tool mutates the Overlay in place and returns a summary + changeId.

import type { Overlay } from "./db";
import { appendChange, getChange, markReverted } from "./db";

export const toolDefs = [
  {
    name: "set_mile_pace",
    description:
      "Set or change the target pace for a single mile. Use when Christina and you agree on a specific pace for a specific mile (e.g., slowing the mile-6 climb or pushing a descent). Pace is in minute:seconds per mile format like '8:45'. Do NOT use for speculative tweaks — only when the conversation clearly lands on a specific pace.",
    input_schema: {
      type: "object",
      properties: {
        mile: {
          type: "integer",
          minimum: 1,
          maximum: 26,
          description:
            "Mile number 1-26 (not 26.2 — the finish segment cannot be overridden)",
        },
        paceMMSS: {
          type: "string",
          pattern: "^\\d{1,2}:\\d{2}$",
          description: "Pace in minutes:seconds per mile, e.g. '8:45'",
        },
        reason: {
          type: "string",
          description:
            'One short sentence explaining WHY in Christina\'s context. No meta-language like "user requested X".',
        },
      },
      required: ["mile", "paceMMSS", "reason"],
    },
  },
  {
    name: "add_mile_bullet",
    description:
      "Append a short, specific note bullet to a mile's expandable card. Use for race-day intelligence that only Christina would find useful: crowd intel, a landmark she mentioned, a fueling reminder tied to that mile. Keep it ≤120 chars, imperative voice. Do NOT use for generic encouragement.",
    input_schema: {
      type: "object",
      properties: {
        mile: { type: "number", description: "Mile number (1-26 or 26.2)" },
        text: {
          type: "string",
          maxLength: 140,
          description: "The bullet text, ≤120 chars. No emoji.",
        },
        reason: { type: "string" },
      },
      required: ["mile", "text", "reason"],
    },
  },
  {
    name: "remove_mile_bullet",
    description:
      "Remove a previously added bullet from a mile. Use when Christina asks to clean up or when a bullet no longer applies.",
    input_schema: {
      type: "object",
      properties: {
        mile: { type: "number" },
        bulletId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["mile", "bulletId", "reason"],
    },
  },
  {
    name: "update_forecast",
    description:
      "Replace the weather reminder body with a fresh summary. Use when Christina reports a new forecast reading or a change in conditions. Keep ≤280 chars, specific about temp/humidity/wind, no fluff.",
    input_schema: {
      type: "object",
      properties: {
        body: { type: "string", maxLength: 320 },
        reason: { type: "string" },
      },
      required: ["body", "reason"],
    },
  },
  {
    name: "add_reminder",
    description:
      "Pin a new reminder card to the bottom Reminders stack. Use sparingly — for insights that emerged from conversation and deserve a permanent home in the plan.",
    input_schema: {
      type: "object",
      properties: {
        label: { type: "string", maxLength: 48 },
        body: { type: "string", maxLength: 320 },
        reason: { type: "string" },
      },
      required: ["label", "body", "reason"],
    },
  },
  {
    name: "revert_change",
    description:
      'Undo a previously applied change by its id. Use when Christina says something like "undo that" or "never mind, put it back".',
    input_schema: {
      type: "object",
      properties: {
        changeId: { type: "integer" },
        reason: { type: "string" },
      },
      required: ["changeId", "reason"],
    },
  },
];

function parsePaceMMSS(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const mm = parseInt(m[1], 10);
  const ss = parseInt(m[2], 10);
  if (ss >= 60 || mm < 0 || mm > 59) return null;
  const total = mm * 60 + ss;
  if (total < 180 || total > 1200) return null;
  return total;
}

function rid(prefix: string) {
  const r = (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  ).replace(/-/g, "");
  return `${prefix}_${r.slice(0, 8)}`;
}

export type ToolOutcome =
  | {
      ok: true;
      changeId: number;
      summary: string;
      applied: Record<string, unknown>;
    }
  | { ok: false; error: string };

export async function executeTool(
  name: string,
  rawArgs: Record<string, unknown>,
  overlay: Overlay,
): Promise<ToolOutcome> {
  try {
    switch (name) {
      case "set_mile_pace": {
        const mile = Number(rawArgs.mile);
        const paceMMSS = String(rawArgs.paceMMSS ?? "");
        const reason = String(rawArgs.reason ?? "").trim();
        if (!Number.isInteger(mile) || mile < 1 || mile > 26)
          return { ok: false, error: "mile must be an integer 1-26" };
        const sec = parsePaceMMSS(paceMMSS);
        if (sec === null)
          return {
            ok: false,
            error: "paceMMSS must be M:SS between 3:00 and 20:00",
          };
        if (!reason) return { ok: false, error: "reason is required" };
        overlay.paceOverrides[String(mile)] = sec;
        const changeId = await appendChange(
          "set_mile_pace",
          { mile, paceMMSS, paceSec: sec },
          reason,
        );
        return {
          ok: true,
          changeId,
          summary: `Mile ${mile} pace set to ${paceMMSS} /mi`,
          applied: { mile, paceMMSS, paceSec: sec },
        };
      }

      case "add_mile_bullet": {
        const mile = Number(rawArgs.mile);
        const text = String(rawArgs.text ?? "").trim();
        const reason = String(rawArgs.reason ?? "").trim();
        if (!(mile > 0 && mile <= 26.2))
          return { ok: false, error: "mile must be 1-26.2" };
        if (!text || text.length > 140)
          return { ok: false, error: "text must be 1-140 chars" };
        if (!reason) return { ok: false, error: "reason is required" };
        const bullet = { id: rid("b"), text };
        const key = String(mile);
        overlay.mileBullets[key] = [
          ...(overlay.mileBullets[key] ?? []),
          bullet,
        ];
        const changeId = await appendChange(
          "add_mile_bullet",
          { mile, bullet },
          reason,
        );
        return {
          ok: true,
          changeId,
          summary: `Added note to Mile ${mile}`,
          applied: { mile, bullet },
        };
      }

      case "remove_mile_bullet": {
        const mile = Number(rawArgs.mile);
        const bulletId = String(rawArgs.bulletId ?? "");
        const reason = String(rawArgs.reason ?? "").trim();
        if (!(mile > 0 && mile <= 26.2))
          return { ok: false, error: "mile must be 1-26.2" };
        if (!bulletId) return { ok: false, error: "bulletId is required" };
        const key = String(mile);
        const list = overlay.mileBullets[key] ?? [];
        const next = list.filter((b) => b.id !== bulletId);
        if (next.length === list.length)
          return { ok: false, error: "bullet not found" };
        overlay.mileBullets[key] = next;
        if (next.length === 0) delete overlay.mileBullets[key];
        const changeId = await appendChange(
          "remove_mile_bullet",
          { mile, bulletId },
          reason,
        );
        return {
          ok: true,
          changeId,
          summary: `Removed a note from Mile ${mile}`,
          applied: { mile, bulletId },
        };
      }

      case "update_forecast": {
        const body = String(rawArgs.body ?? "").trim();
        const reason = String(rawArgs.reason ?? "").trim();
        if (!body || body.length > 320)
          return { ok: false, error: "body must be 1-320 chars" };
        if (!reason) return { ok: false, error: "reason is required" };
        overlay.forecast = { body, updatedAt: new Date().toISOString() };
        const changeId = await appendChange(
          "update_forecast",
          { body },
          reason,
        );
        return {
          ok: true,
          changeId,
          summary: "Forecast updated",
          applied: { body },
        };
      }

      case "add_reminder": {
        const label = String(rawArgs.label ?? "").trim();
        const body = String(rawArgs.body ?? "").trim();
        const reason = String(rawArgs.reason ?? "").trim();
        if (!label || label.length > 48)
          return { ok: false, error: "label must be 1-48 chars" };
        if (!body || body.length > 320)
          return { ok: false, error: "body must be 1-320 chars" };
        if (!reason) return { ok: false, error: "reason is required" };
        const reminder = { id: rid("r"), label, body };
        overlay.reminders.push(reminder);
        const changeId = await appendChange(
          "add_reminder",
          { reminder },
          reason,
        );
        return {
          ok: true,
          changeId,
          summary: `Pinned reminder: ${label}`,
          applied: { reminder },
        };
      }

      case "revert_change": {
        const changeId = Number(rawArgs.changeId);
        const reason = String(rawArgs.reason ?? "").trim();
        if (!Number.isInteger(changeId))
          return { ok: false, error: "changeId must be an integer" };
        const change = await getChange(changeId);
        if (!change) return { ok: false, error: "change not found" };
        if (change.reverted_at)
          return { ok: false, error: "change already reverted" };
        const outcome = revertChangeInOverlay(change, overlay);
        if (!outcome.ok) return outcome;
        await markReverted(changeId);
        const newId = await appendChange(
          "revert_change",
          { revertedChangeId: changeId },
          reason,
        );
        return {
          ok: true,
          changeId: newId,
          summary: `Reverted change #${changeId}`,
          applied: { revertedChangeId: changeId },
        };
      }

      default:
        return { ok: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

function revertChangeInOverlay(
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
      const bulletId = (args as { bullet: { id: string } }).bullet.id;
      const list = overlay.mileBullets[mile] ?? [];
      const next = list.filter((b) => b.id !== bulletId);
      if (next.length === 0) delete overlay.mileBullets[mile];
      else overlay.mileBullets[mile] = next;
      return { ok: true };
    }
    case "remove_mile_bullet": {
      // Cannot losslessly revert a remove — we didn't snapshot the bullet text.
      return {
        ok: false,
        error:
          "cannot revert a remove_mile_bullet — re-add the bullet manually",
      };
    }
    case "update_forecast": {
      // Cannot losslessly revert a forecast swap — prior body not stored inline.
      return {
        ok: false,
        error:
          "cannot revert forecast updates — use update_forecast to replace",
      };
    }
    case "add_reminder": {
      const id = (args as { reminder: { id: string } }).reminder.id;
      overlay.reminders = overlay.reminders.filter((r) => r.id !== id);
      return { ok: true };
    }
    default:
      return { ok: false, error: `cannot revert tool: ${tool}` };
  }
}
