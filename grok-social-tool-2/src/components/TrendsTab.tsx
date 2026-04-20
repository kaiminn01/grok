"use client";

import React, { useState } from "react";
import { Button, Card, CopyButton, Badge, ScoreBadge, SkeletonCard, ErrorBox, EmptyState, SectionLabel, Input } from "@/components/ui";
import { useClient } from "@/lib/client-context";
import type { TrendTopic, TrendsResponse } from "@/app/api/trends/route";

export default function TrendsTab() {
  const { activeClient } = useClient();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrendsResponse | null>(null);

  const effectiveKeywords = keywords.length > 0 ? keywords : activeClient.keywords;

  const addKeyword = () => {
    const v = inputVal.trim();
    if (v && !keywords.includes(v)) setKeywords([...keywords, v]);
    setInputVal("");
  };

  const handleScan = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/trends", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: effectiveKeywords, client: activeClient.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div>
          <SectionLabel>keyword clusters</SectionLabel>
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {effectiveKeywords.map((kw) => (
              <span key={kw} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border
                ${keywords.includes(kw) ? "bg-accent/15 border-accent/25 text-accent" : "bg-surface-3 border-white/8 text-muted"}`}>
                {kw}
                {keywords.includes(kw) && (
                  <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} className="text-accent/50 hover:text-accent">×</button>
                )}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="add keyword..." value={inputVal} onChange={setInputVal}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()} className="flex-1" />
            <Button onClick={addKeyword} variant="secondary">Add</Button>
          </div>
          {keywords.length === 0 && (
            <p className="text-xs text-muted mt-1.5 font-mono">↑ using {activeClient.label} defaults — add custom keywords to override</p>
          )}
        </div>
        <Button onClick={handleScan} loading={loading}>
          {loading ? "Scanning..." : "↯ Scan Trends"}
        </Button>
      </Card>

      {error && <ErrorBox message={error} />}
      {loading && <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>}

      {result && !loading && (
        <div className="space-y-4 animate-in">
          <div className="p-4 rounded-lg bg-accent/8 border border-accent/20">
            <SectionLabel>macro signal</SectionLabel>
            <p className="mt-1 text-sm text-ink/80 leading-relaxed">{result.meta_summary}</p>
          </div>
          {result.topics.map((topic, i) => <TopicCard key={i} topic={topic} />)}
        </div>
      )}
      {!loading && !result && !error && <EmptyState icon="◈" message="scan keywords to detect trending angles" />}
    </div>
  );
}

function TopicCard({ topic }: { topic: TrendTopic }) {
  const allText = [topic.topic, topic.why_it_matters,
    "Reply angles:\n" + topic.suggested_reply_angles.join("\n"),
    "Post angles:\n" + topic.suggested_post_angles.join("\n"),
    topic.draft_tweets?.length ? "Draft tweets:\n" + topic.draft_tweets.join("\n") : "",
  ].filter(Boolean).join("\n\n");

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-sm font-semibold text-ink">{topic.topic}</h3>
          <Badge label={topic.momentum} />
          <ScoreBadge score={topic.relevance_score} />
        </div>
        <CopyButton text={allText} />
      </div>
      <p className="text-sm text-ink/70 leading-relaxed">{topic.why_it_matters}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AngleList label="reply angles" items={topic.suggested_reply_angles} />
        <AngleList label="post angles" items={topic.suggested_post_angles} />
      </div>

      {topic.draft_tweets?.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>draft tweets — ready to post</SectionLabel>
          {topic.draft_tweets.map((tweet, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-surface-2 border border-white/8 group">
              <p className="text-xs text-ink leading-relaxed flex-1">{tweet}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-mono ${tweet.length > 250 ? "text-warn" : "text-ok"}`}>{tweet.length}c</span>
                <CopyButton text={tweet} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AngleList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 group">
            <span className="text-accent/40 font-mono text-xs mt-0.5 shrink-0">→</span>
            <span className="text-xs text-ink/75 leading-relaxed flex-1">{item}</span>
            <CopyButton text={item} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}
