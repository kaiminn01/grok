/**
 * lib/grok.ts
 * Central helper for all xAI Grok API calls.
 *
 * xAI's API is OpenAI-compatible, so we use the `openai` SDK pointed at the xAI base URL.
 * Model reference (swap here if xAI releases new versions):
 *   - "grok-3"        → best reasoning, strong prompt following (default)
 *   - "grok-3-mini"   → faster, cheaper, still capable
 *   - "grok-2-vision" → if image input is needed later
 *
 * Docs: https://docs.x.ai/api
 */

import OpenAI from "openai";

// ── Client singleton ─────────────────────────────────────────────────────────

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "XAI_API_KEY is not set. Add it to your .env.local file."
      );
    }
    _client = new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1", // xAI's OpenAI-compatible endpoint
    });
  }
  return _client;
}

// ── Model config ─────────────────────────────────────────────────────────────

/** Change GROK_MODEL env var to swap models globally, or pass `model` per-call. */
export const DEFAULT_MODEL = process.env.GROK_MODEL ?? "grok-3";

// ── Types ────────────────────────────────────────────────────────────────────

export interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GrokOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  /** If true, attempt to parse response as JSON and return parsed object */
  json?: boolean;
}

// ── Core call ────────────────────────────────────────────────────────────────

/**
 * Primary wrapper around the Grok chat completions endpoint.
 * Returns the assistant's text response (or parsed JSON if `options.json` is true).
 */
export async function grokChat(
  messages: GrokMessage[],
  options: GrokOptions = {}
): Promise<string> {
  const client = getClient();
  const debug = process.env.GROK_DEBUG === "true";

  const model = options.model ?? DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.7;
  const max_tokens = options.max_tokens ?? 2000;

  if (debug) {
    console.log("[grok] call →", { model, messages: messages.length });
  }

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens,
    // Request JSON output at the API level when structured data is needed
    ...(options.json
      ? { response_format: { type: "json_object" } }
      : {}),
  });

  const text = response.choices[0]?.message?.content ?? "";

  if (debug) {
    console.log("[grok] response →", text.slice(0, 200));
  }

  return text;
}

/**
 * Convenience: single system + user turn.
 * Used by most feature handlers.
 */
export async function grokAsk(
  systemPrompt: string,
  userContent: string,
  options: GrokOptions = {}
): Promise<string> {
  return grokChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    options
  );
}

/**
 * Convenience: returns parsed JSON object.
 * Caller specifies the shape via generic T.
 */
export async function grokJSON<T = unknown>(
  systemPrompt: string,
  userContent: string,
  options: GrokOptions = {}
): Promise<T> {
  const raw = await grokAsk(systemPrompt, userContent, {
    ...options,
    json: true,
    temperature: options.temperature ?? 0.4, // lower temp for structured output
  });

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Fallback: strip markdown fences if model wraps anyway
    const cleaned = raw.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  }
}
