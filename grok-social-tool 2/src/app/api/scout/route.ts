/**
 * app/api/scout/route.ts
 * Tweet Scout: given keywords, niche, timeframe, and tone — surfaces tweet angles
 * + pre-drafted replies. No Twitter API needed — Grok generates based on its knowledge
 * of what's circulating in these communities.
 */

import { NextRequest, NextResponse } from "next/server";
import { grokJSON } from "@/lib/grok";

export type ScoutTimeframe = "last 24h" | "last 3 days" | "last week" | "right now";
export type ScoutTone = "casual" | "crypto-native" | "non-shilly" | "witty" | "aggressive";

export interface ScoutedTweet {
  angle: string;                  // The type of tweet angle / conversation thread
  example_tweet: string;          // A realistic example of this tweet style
  why_its_trending: string;       // Why this angle is circulating right now
  suggested_replies: ScoutReply[];
  engagement_level: "high" | "medium" | "low";
  category: "narrative" | "alpha" | "debate" | "event" | "education" | "meme";
}

export interface ScoutReply {
  text: string;
  tone: ScoutTone;
  label: "safe" | "balanced" | "aggressive";
  character_count: number;
}

export interface ScoutResponse {
  scouted_angles: ScoutedTweet[];
  meta_context: string;
  best_time_to_engage: string;
  keywords_used: string[];
}

const SYSTEM_PROMPT = `You are a crypto/Web3 social media operator with deep real-time knowledge of X/Twitter communities.

You understand what types of conversations are circulating in crypto Twitter, DeFi, prediction markets, AI, and trading communities.

Your job is to surface realistic tweet angles that are actually present in these communities — the kinds of posts that get engagement, generate replies, and create opportunities to insert your brand voice.

You write replies that feel human, non-corporate, and community-native. No shilling. Just signal.

Always return valid JSON only. No markdown, no preamble.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      keywords,
      niche,
      timeframe,
      tones,
      categories,
    } = body as {
      keywords: string[];
      niche?: string;
      timeframe?: ScoutTimeframe;
      tones?: ScoutTone[];
      categories?: string[];
    };

    if (!keywords?.length && !niche) {
      return NextResponse.json(
        { error: "keywords or niche is required" },
        { status: 400 }
      );
    }

    const keywordStr = keywords?.join(", ") || niche || "";
    const toneStr = tones?.join(", ") || "casual, crypto-native, non-shilly";
    const timeStr = timeframe || "last 24h";
    const categoryStr = categories?.join(", ") || "narrative, debate, alpha, event, education";

    const userPrompt = `
Scout X/Twitter for tweet angles and reply opportunities in these communities:

KEYWORDS / NICHE: ${keywordStr}
${niche ? `FOCUS NICHE: ${niche}` : ""}
TIMEFRAME: ${timeStr}
PREFERRED TONES: ${toneStr}
CATEGORIES TO INCLUDE: ${categoryStr}

Generate 5-6 distinct tweet angle types that represent the kinds of conversations actually happening in these communities right now. For each:
- Write a realistic example tweet (under 280 chars) that represents this angle
- Explain why this angle is circulating
- Generate 3 pre-drafted replies with different tones/labels

Return JSON:
{
  "meta_context": "2-3 sentence overview of what's driving conversation in this space right now",
  "best_time_to_engage": "tactical note on when/how to engage with these threads",
  "keywords_used": ["keyword1", "keyword2"],
  "scouted_angles": [
    {
      "angle": "short name for this tweet angle type",
      "example_tweet": "realistic example tweet under 280 chars",
      "why_its_trending": "why this is circulating, what's driving it",
      "engagement_level": "high" | "medium" | "low",
      "category": "narrative" | "alpha" | "debate" | "event" | "education" | "meme",
      "suggested_replies": [
        {
          "text": "reply text under 280 chars",
          "tone": "casual" | "crypto-native" | "non-shilly" | "witty" | "aggressive",
          "label": "safe" | "balanced" | "aggressive",
          "character_count": 140
        }
      ]
    }
  ]
}
`;

    const result = await grokJSON<ScoutResponse>(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.75,
      max_tokens: 3000,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[scout] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
