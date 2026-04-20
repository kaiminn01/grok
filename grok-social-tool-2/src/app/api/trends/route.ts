import { NextRequest, NextResponse } from "next/server";
import { grokJSON } from "@/lib/grok";

export interface TrendTopic {
  topic: string;
  why_it_matters: string;
  suggested_reply_angles: string[];
  suggested_post_angles: string[];
  draft_tweets: string[];
  momentum: "rising" | "stable" | "fading";
  relevance_score: number;
}

export interface TrendsResponse {
  topics: TrendTopic[];
  meta_summary: string;
  generated_at: string;
}

const SYSTEM_PROMPT = `You are a senior crypto/Web3 social media strategist. Surface trending angles and write ready-to-post tweet drafts that sound human, insider-credible, lowercase, no hashtags, non-shilly. Return valid JSON only.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keywords, client } = body as { keywords: string[]; client?: string };
    if (!keywords?.length) return NextResponse.json({ error: "keywords required" }, { status: 400 });

    const clientCtx = client === "OmenX" ? "Focus on angles for a leveraged prediction/outcome trading platform on Base. Long/short outcome trading + fully collateralized no-liquidation mode."
      : client === "SuperNet" ? "Focus on angles for an AI agent platform."
      : client === "SuperClaw" ? "Focus on angles for managed AI hosting/infrastructure."
      : "";

    const userPrompt = `Analyze for trending angles: KEYWORDS: ${keywords.join(", ")}
${client ? `CLIENT: ${client} — ${clientCtx}` : ""}

For each topic write 2-3 ready-to-post tweet drafts: lowercase, no hashtags, under 280c, human/insider tone.

Return JSON:
{
  "topics": [{
    "topic": "name",
    "why_it_matters": "2-3 sentences",
    "suggested_reply_angles": ["a1","a2","a3"],
    "suggested_post_angles": ["p1","p2","p3"],
    "draft_tweets": ["tweet1 <280c","tweet2 <280c","tweet3 <280c"],
    "momentum": "rising"|"stable"|"fading",
    "relevance_score": 8
  }],
  "meta_summary": "1-2 sentence overview",
  "generated_at": "${new Date().toISOString()}"
}
Generate 4-6 topics. Be specific.`;

    const result = await grokJSON<TrendsResponse>(SYSTEM_PROMPT, userPrompt, { temperature: 0.6, max_tokens: 3000 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
