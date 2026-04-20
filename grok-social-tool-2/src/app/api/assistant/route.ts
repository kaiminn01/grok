/**
 * app/api/assistant/route.ts
 * General Grok Assistant: multi-turn chat for research, analysis, and ad-hoc queries.
 */

import { NextRequest, NextResponse } from "next/server";
import { grokChat } from "@/lib/grok";
import type { GrokMessage } from "@/lib/grok";

export interface AssistantRequest {
  messages: GrokMessage[];
}

export interface AssistantResponse {
  reply: string;
}

const SYSTEM_PROMPT = `You are a senior Web3 growth and marketing research assistant with deep expertise in:
- Crypto/DeFi ecosystems (Ethereum, Base, BNB Chain, Solana, and beyond)
- Prediction markets (Polymarket, Kalshi, and emerging DeFi prediction platforms)
- AI and agent platforms
- X/Twitter social dynamics and community building
- KOL and influencer ecosystems
- Southeast Asian crypto markets (Singapore, Malaysia, Indonesia focus)
- Go-to-market strategy for Web3 products

You give direct, credible, operator-level answers. You don't hedge unnecessarily.
You write concisely but completely. You use structure (bullets, sections) when it helps clarity.
You speak to someone who is already inside the industry.

If you don't know something or it's outside your training, say so clearly rather than hallucinating.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body as AssistantRequest;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Inject system prompt at the front
    const fullMessages: GrokMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    const reply = await grokChat(fullMessages, {
      temperature: 0.7,
      max_tokens: 2000,
    });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[assistant] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
