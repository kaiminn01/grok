/**
 * app/api/notion-save/route.ts
 * Saves a KOL or Partner card to the Notion KOL & Partner Tracker database.
 *
 * Uses the Notion API directly via fetch — no extra SDK needed.
 * Notion database ID: 4bd33c0fbb6b4c8da24c0ee32efbf5b6
 */

import { NextRequest, NextResponse } from "next/server";

const NOTION_DATABASE_ID = "4bd33c0fbb6b4c8da24c0ee32efbf5b6";
const NOTION_API_VERSION = "2022-06-28";

export interface NotionSavePayload {
  type: "KOL" | "Partner";
  name: string;
  handle: string;
  niche?: string;
  client?: string;
  kol_category?: string;
  follower_range?: string;
  priority_score?: number;
  collaboration_fit?: string;
  partnership_type?: string;
  engagement_angle?: string;
  outreach_angle?: string;
  why_they_matter?: string;
  audience_type?: string;
}

export async function POST(req: NextRequest) {
  try {
    const notionKey = process.env.NOTION_API_KEY;
    if (!notionKey) {
      return NextResponse.json(
        { error: "NOTION_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json() as NotionSavePayload;
    const { handle } = body;

    if (!handle) {
      return NextResponse.json({ error: "handle is required" }, { status: 400 });
    }

    // Build the Twitter URL from handle
    const cleanHandle = handle.replace(/^@/, "");
    const twitterUrl = `https://twitter.com/${cleanHandle}`;

    // Build Notion page properties
    const properties: Record<string, unknown> = {
      Name: {
        title: [{ text: { content: body.name || handle } }],
      },
      Handle: {
        rich_text: [{ text: { content: handle } }],
      },
      "Twitter Link": {
        url: twitterUrl,
      },
      Type: {
        select: { name: body.type },
      },
    };

    if (body.niche) {
      properties["Niche"] = { rich_text: [{ text: { content: body.niche } }] };
    }
    if (body.client) {
      properties["Client"] = { select: { name: body.client } };
    }
    if (body.kol_category) {
      properties["KOL Category"] = { select: { name: body.kol_category } };
    }
    if (body.follower_range) {
      properties["Follower Range"] = { rich_text: [{ text: { content: body.follower_range } }] };
    }
    if (body.priority_score !== undefined) {
      properties["Priority Score"] = { number: body.priority_score };
    }
    if (body.collaboration_fit) {
      properties["Collaboration Fit"] = { select: { name: body.collaboration_fit } };
    }
    if (body.partnership_type) {
      properties["Partnership Type"] = { select: { name: body.partnership_type } };
    }
    if (body.engagement_angle) {
      properties["Engagement Angle"] = { rich_text: [{ text: { content: body.engagement_angle } }] };
    }
    if (body.outreach_angle) {
      properties["Outreach Angle"] = { rich_text: [{ text: { content: body.outreach_angle } }] };
    }
    if (body.why_they_matter) {
      properties["Why They Matter"] = { rich_text: [{ text: { content: body.why_they_matter } }] };
    }
    if (body.audience_type) {
      properties["Audience Type"] = { rich_text: [{ text: { content: body.audience_type } }] };
    }

    // Default outreach status to "not contacted"
    properties["Outreach Status"] = { select: { name: "not contacted" } };

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionKey}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_API_VERSION,
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("[notion-save] Notion API error:", errData);
      return NextResponse.json(
        { error: errData.message ?? "Notion API error" },
        { status: response.status }
      );
    }

    const page = await response.json();
    return NextResponse.json({ success: true, page_id: page.id, url: page.url });
  } catch (err) {
    console.error("[notion-save] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
