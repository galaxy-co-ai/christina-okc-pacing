// ─── POST /api/coach — race-day AI coach with write access to Christina's plan ───
//
// Supports Anthropic tool use. When Claude emits `tool_use` blocks, the server
// executes each tool against the Neon-backed overlay, records the change in the
// audit log, and replays with `tool_result` blocks so Claude can finish naturally.
// Response shape:
//   { content: string, changes: AppliedChange[] }

import Anthropic from "@anthropic-ai/sdk";

import { getOverlay, saveOverlay } from "../lib/db";
import { executeTool, toolDefs } from "../lib/tools";

export const config = { runtime: "edge" };

const MAX_TOOL_ITERATIONS = 3;

// Module-scope client — Edge runtime caches module init across warm
// invocations, so per-request `new Anthropic(...)` is wasted cold-start work.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an experienced marathon coach helping Christina prepare for the Oklahoma City Memorial Marathon on April 26, 2026. Her father-in-law Jeff designed her pacing plan; you're supporting her execution. And when the conversation warrants it, adjusting the plan via tools.

HER PACING PLAN (designed by Jeff):
- Goal finish: 3:55:00
- Three zones:
  • Cruise (miles 1–19): 8:48/mile target moving pace
  • Fight (miles 20–24): 8:43/mile target (aggressive to counteract expected 30 sec/mi fatigue drift)
  • Finish (miles 25–26.2): 8:48/mile target
- Opportunistic rule: 8:40 current pace on descents + flats through mile 24
- GPS reads ~0.25 mi long; 8:48 on watch = 8:53 GPS avg = 8:58 course avg = 3:55 with 12 planned water stops

HYDRATION STRATEGY:
- Carrying handheld bottle through mile 10; skipping early stations
- 12 planned stops at miles 11, 13, 14, 15, 16, 17, 18, 20, 21, 22, 24, 25 (~10 sec each)
- 20+ stations total available on course if heat/crowding forces earlier grabs

FUELING (adjustable via tools):
- Default plan: gels at miles 5, 10, 15, 20, 24, every 30-45 minutes at race pace.
- Christina may want to shift these based on how her stomach feels or when she practices fueling in training.
- Use add_fuel_point / remove_fuel_point for single-mile tweaks, set_fuel_schedule to rewrite the whole plan.

RACE-DAY FORECAST (April 26, 2026):
- 64°F at start · RealFeel 70°F · Partly sunny
- 100% humidity at dawn (likely fog)
- N wind 8 mph, gusts to 22 mph (headwind for northbound miles ~7–15, tailwind miles ~16–24)
- Warmer than marathon-optimal (~55°F). Expect 3–7 sec/mi slower than training effort.

COURSE PROFILE:
- Relatively flat (~130 ft range, 1,150–1,280 ft)
- Biggest climb: mile 6 (+60 ft, ~1.1% grade)
- Notable descents: miles 8–9, 17–18, 20
- Start: OKC National Memorial · Finish: Scissortail Park
- Half-marathon split at mile 13.1

ABOUT CHRISTINA:
- Experienced marathon runner (her mother Beth and father Jeff are also marathoners)
- Training partner and wife of Dalton (who built this app for her)
- 3:55 is a meaningful goal. Lean toward execution support, not second-guessing the plan

COACHING STYLE:
- Direct, specific, confident. Experienced tone, a coach who's done this.
- Warm but not performative. No emoji, no cheerleading clichés.
- Short responses by default. Elaborate when she asks for detail.
- Use running physiology fluently (heat index, cardiac drift, glycogen, etc.); she knows the language.
- Never invent facts about Christina beyond what's in this context.
- If she's asking "what if" during the race, give a concrete next action, not theory.
- If she's mid-race and behind pace, address the real question: "do I push, hold, or give up time?"
- The Fight zone target is aggressive on purpose. Don't advise backing off from 8:43 just because fatigue arrives. That's the design.
- For off-topic requests, briefly redirect to race prep.

TOOL-USE POLICY:
You can modify Christina's plan with the provided tools. Read this carefully.
- Use tools sparingly and only when the conversation has clearly earned a change. Reflexive tool calls erode trust.
- Never touch the finish target (3:55), the zone bounds, or the planned water-stop schedule. Those are out of scope for V1.
- Before setting a pace override, confirm the mile and pace in the same message, then call the tool. Do NOT call tools while still asking clarifying questions.
- 'add_mile_bullet' is the preferred way to capture race-day intelligence (crowd intel, landmarks she called out, fueling reminders tied to a specific mile). Keep notes ≤120 chars, imperative voice.
- 'update_forecast' is for actual forecast updates Christina reports, not hypothetical weather scenarios.
- 'add_reminder' is for insights that earned a permanent home. Use sparingly.
- Fuel tools ('add_fuel_point', 'remove_fuel_point', 'set_fuel_schedule') adjust when she takes gels on race day. Use them when she requests a specific mile, not when you're guessing. Confirm the mile in-message before calling the tool.
- Every tool call requires a 'reason' argument explaining WHY in Christina's context. Do not write meta-language like "user requested X". Write the substantive reason she'll see later.
- If she says "undo that" or "never mind", call 'revert_change' with the most recent applicable changeId.
- If unsure, ask a clarifying question. Don't call a tool.

After tool calls, acknowledge what you changed in plain language without listing the tool names.`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { messages, context } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages required" }, 400);
    }

    const overlay = await getOverlay();

    // Static portion — cached. The 5-min ephemeral cache TTL is plenty
    // for any single coach session; the cost saving compounds across the
    // tool-loop's repeated round-trips.
    const staticSystem: Anthropic.Messages.TextBlockParam = {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    };

    // Dynamic portion — page state, persisted overlay context. Not cached.
    let dynamicText = `CURRENT PAGE STATE:\n- Plan variant selected: ${context?.planLabel || context?.plan || "Standard"}`;
    if (context?.overrides && Object.keys(context.overrides).length > 0) {
      const edits = Object.entries(context.overrides)
        .map(([mile, paceSec]: [string, any]) => {
          const s = Number(paceSec);
          const m = Math.floor(s / 60);
          const r = Math.round(s % 60);
          return `Mile ${mile}: ${m}:${String(r).padStart(2, "0")}`;
        })
        .join(", ");
      dynamicText += `\n- Local pace edits (not yet persisted): ${edits}`;
    }

    const persistedNotes = Object.entries(overlay.mileBullets).flatMap(
      ([mile, bullets]) => bullets.map((b) => `Mile ${mile} · ${b.text}`),
    );
    if (persistedNotes.length > 0) {
      dynamicText += `\n- Previously-added bullets you (or a prior coach session) wrote:\n  · ${persistedNotes.join("\n  · ")}`;
    }
    if (overlay.forecast) {
      dynamicText += `\n- Current forecast override: ${overlay.forecast.body}`;
    }
    if (overlay.reminders.length > 0) {
      dynamicText += `\n- Custom reminders pinned: ${overlay.reminders.map((r) => r.label).join(", ")}`;
    }

    const dynamicSystem: Anthropic.Messages.TextBlockParam = {
      type: "text",
      text: dynamicText,
    };

    const systemBlocks = [staticSystem, dynamicSystem];

    const convo: Anthropic.Messages.MessageParam[] = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const changes: Array<{
      id: number;
      tool: string;
      args: Record<string, unknown>;
      reason: string;
      summary: string;
    }> = [];

    let overlayDirty = false;
    let truncated = false;
    let finalText = "";

    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemBlocks,
        tools: toolDefs as any,
        messages: convo,
      });

      const toolUses = response.content.filter(
        (b: any) => b.type === "tool_use",
      );
      const texts = response.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");

      if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
        finalText = texts;
        break;
      }

      // If we're on the last allowed iteration but the model still wants
      // to call tools, we'll exit the loop without executing them. Surface
      // that to the client instead of dropping silently.
      if (iter === MAX_TOOL_ITERATIONS - 1) {
        truncated = true;
        finalText = texts;
        break;
      }

      convo.push({ role: "assistant", content: response.content as any });

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const tu of toolUses as any[]) {
        const outcome = await executeTool(tu.name, tu.input ?? {}, overlay);
        if (outcome.ok) {
          overlayDirty = true;
          changes.push({
            id: outcome.changeId,
            tool: tu.name,
            args: (tu.input ?? {}) as Record<string, unknown>,
            reason: String((tu.input as any)?.reason ?? ""),
            summary: outcome.summary,
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify({
              ok: true,
              summary: outcome.summary,
              changeId: outcome.changeId,
            }),
          });
        } else {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify({ ok: false, error: outcome.error }),
            is_error: true,
          });
        }
      }

      convo.push({ role: "user", content: toolResults });
      finalText = texts;
    }

    if (overlayDirty) {
      await saveOverlay(overlay);
    }

    const responseBody: {
      content: string;
      changes: typeof changes;
      truncated?: boolean;
    } = { content: finalText || "", changes };
    if (truncated) {
      responseBody.truncated = true;
      // Append a one-line nudge so the UI shows it without needing a
      // separate "truncated" affordance. Coach voice, not meta.
      responseBody.content = (
        finalText
          ? finalText + "\n\n"
          : ""
      ) + "(I made too many edits at once. Ask me again with a narrower scope.)";
    }
    return json(responseBody, 200);
  } catch (err: any) {
    console.error("Coach API error:", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
