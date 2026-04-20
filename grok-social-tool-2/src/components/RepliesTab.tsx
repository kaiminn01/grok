"use client";

import React, { useState } from "react";
import {
  Button, Card, CopyButton, Badge, SkeletonCard, ErrorBox,
  EmptyState, SectionLabel, Textarea, Input
} from "@/components/ui";
import { useClient } from "@/lib/client-context";
import type { RepliesResponse, SuggestedReply, ToneOption } from "@/app/api/replies/route";
import type { ScoutResponse, ScoutedTweet, ScoutTone, ScoutTimeframe } from "@/app/api/scout/route";

const TONE_OPTIONS: { value: ToneOption; desc: string }[] = [
  { value: "casual",        desc: "natural, lowercase" },
  { value: "crypto-native", desc: "insider vocab" },
  { value: "non-shilly",    desc: "credible, grounded" },
  { value: "witty",         desc: "sharp, clever" },
];

const TIMEFRAMES: ScoutTimeframe[] = ["last 24h", "last 3 days", "last week", "right now"];
const CATEGORIES = ["narrative", "alpha", "debate", "event", "education", "meme"];

type Mode = "paste" | "scout";

export default function RepliesTab() {
  const { activeClient } = useClient();
  const [mode, setMode] = useState<Mode>("scout");

  // Paste mode
  const [tweetText, setTweetText] = useState("");
  const [selectedTones, setSelectedTones] = useState<ToneOption[]>(["casual","crypto-native","non-shilly","witty"]);
  const [pasteResult, setPasteResult] = useState<RepliesResponse | null>(null);

  // Scout mode
  const [scoutKeywords, setScoutKeywords] = useState("");
  const [scoutNiche, setScoutNiche] = useState("");
  const [scoutTimeframe, setScoutTimeframe] = useState<ScoutTimeframe>("last 24h");
  const [scoutTones, setScoutTones] = useState<ScoutTone[]>(["casual","crypto-native","non-shilly"]);
  const [scoutCategories, setScoutCategories] = useState<string[]>(["narrative","alpha","debate","event"]);
  const [scoutResult, setScoutResult] = useState<ScoutResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTone = (tone: ToneOption) =>
    setSelectedTones(p => p.includes(tone) ? (p.length > 1 ? p.filter(t => t !== tone) : p) : [...p, tone]);

  const toggleScoutTone = (tone: ScoutTone) =>
    setScoutTones(p => p.includes(tone) ? (p.length > 1 ? p.filter(t => t !== tone) : p) : [...p, tone]);

  const toggleCategory = (cat: string) =>
    setScoutCategories(p => p.includes(cat) ? (p.length > 1 ? p.filter(c => c !== cat) : p) : [...p, cat]);

  const handlePaste = async () => {
    if (!tweetText.trim()) return;
    setLoading(true); setError(null); setPasteResult(null);
    try {
      const res = await fetch("/api/replies", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweet_text: tweetText, tones: selectedTones }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");
      setPasteResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  const handleScout = async () => {
    const kws = scoutKeywords.trim()
      ? scoutKeywords.split(",").map(k => k.trim()).filter(Boolean)
      : activeClient.keywords;
    setLoading(true); setError(null); setScoutResult(null);
    try {
      const res = await fetch("/api/scout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: kws,
          niche: scoutNiche || activeClient.niche,
          timeframe: scoutTimeframe,
          tones: scoutTones,
          categories: scoutCategories,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");
      setScoutResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-lg w-fit">
        {([["scout","↯ Tweet Scout"],["paste","↩ Paste Tweet"]] as [Mode, string][]).map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-md text-xs font-mono transition-all
              ${mode === m ? "bg-accent text-white shadow-accent-sm" : "text-muted hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Scout mode */}
      {mode === "scout" && (
        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SectionLabel>keywords (comma separated)</SectionLabel>
              <Input placeholder={activeClient.keywords.slice(0,3).join(", ") + "..."} value={scoutKeywords} onChange={setScoutKeywords} className="mt-1.5" />
            </div>
            <div>
              <SectionLabel>niche / focus</SectionLabel>
              <Input placeholder={activeClient.niche} value={scoutNiche} onChange={setScoutNiche} className="mt-1.5" />
            </div>
          </div>
          <div>
            <SectionLabel>timeframe</SectionLabel>
            <div className="flex gap-2 mt-2 flex-wrap">
              {TIMEFRAMES.map(t => (
                <button key={t} onClick={() => setScoutTimeframe(t)}
                  className={`px-3 py-1 rounded-full text-xs font-mono border transition-all
                    ${scoutTimeframe === t ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface-2 border-white/8 text-muted hover:text-ink"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SectionLabel>tones</SectionLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {(["casual","crypto-native","non-shilly","witty","aggressive"] as ScoutTone[]).map(t => (
                  <button key={t} onClick={() => toggleScoutTone(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all
                      ${scoutTones.includes(t) ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface-2 border-white/8 text-muted hover:text-ink"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <SectionLabel>categories</SectionLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => toggleCategory(c)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all
                      ${scoutCategories.includes(c) ? "bg-electric/20 border-electric/40 text-electric" : "bg-surface-2 border-white/8 text-muted hover:text-ink"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={handleScout} loading={loading}>
            {loading ? "Scouting..." : "↯ Scout Tweets"}
          </Button>
        </Card>
      )}

      {/* Paste mode */}
      {mode === "paste" && (
        <Card className="p-5 space-y-4">
          <div>
            <SectionLabel>paste tweet or post text</SectionLabel>
            <Textarea placeholder="paste the tweet you want to reply to..." value={tweetText} onChange={setTweetText} rows={4} className="mt-2" />
            <div className="flex justify-end mt-1">
              <span className={`text-xs font-mono ${tweetText.length > 2000 ? "text-warn" : "text-muted"}`}>{tweetText.length} chars</span>
            </div>
          </div>
          <div>
            <SectionLabel>tone preferences</SectionLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {TONE_OPTIONS.map(t => (
                <button key={t.value} onClick={() => toggleTone(t.value)} title={t.desc}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all
                    ${selectedTones.includes(t.value) ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface-2 border-white/8 text-muted hover:text-ink"}`}>
                  {t.value}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handlePaste} loading={loading} disabled={!tweetText.trim()}>
            {loading ? "Generating..." : "↯ Generate Replies"}
          </Button>
        </Card>
      )}

      {error && <ErrorBox message={error} />}
      {loading && <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>}

      {/* Scout results */}
      {scoutResult && mode === "scout" && !loading && (
        <div className="space-y-4 animate-in">
          <div className="p-4 rounded-lg bg-accent/8 border border-accent/20">
            <SectionLabel>market context</SectionLabel>
            <p className="mt-1 text-sm text-ink/80 leading-relaxed">{scoutResult.meta_context}</p>
            {scoutResult.best_time_to_engage && (
              <p className="mt-2 text-xs text-muted italic">↯ {scoutResult.best_time_to_engage}</p>
            )}
          </div>
          {scoutResult.scouted_angles.map((angle, i) => (
            <ScoutedAngleCard key={i} angle={angle} index={i+1} />
          ))}
        </div>
      )}

      {/* Paste results */}
      {pasteResult && mode === "paste" && !loading && (
        <div className="space-y-4 animate-in">
          <div className="p-4 rounded-lg bg-surface-2 border border-white/6">
            <SectionLabel>context read</SectionLabel>
            <p className="mt-1 text-xs text-ink/65 leading-relaxed">{pasteResult.context_read}</p>
          </div>
          {pasteResult.replies.map((reply, i) => (
            <ReplyCard key={i} reply={reply} index={i+1} />
          ))}
        </div>
      )}

      {!loading && !scoutResult && !pasteResult && !error && (
        <EmptyState icon="↩" message={mode === "scout" ? "configure and scout for tweet angles" : "paste a tweet to generate replies"} />
      )}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  narrative: "text-accent border-accent/30 bg-accent/10",
  alpha:     "text-ok border-ok/30 bg-ok/10",
  debate:    "text-warn border-warn/30 bg-warn/10",
  event:     "text-electric border-electric/30 bg-electric/10",
  education: "text-muted border-white/15 bg-surface-3",
  meme:      "text-accent border-accent/30 bg-accent/10",
};

function ScoutedAngleCard({ angle, index }: { angle: ScoutedTweet; index: number }) {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted">#{index}</span>
          <span className="text-sm font-semibold text-ink">{angle.angle}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border ${CATEGORY_COLORS[angle.category] ?? "text-muted border-white/10 bg-surface-3"}`}>
            {angle.category}
          </span>
          <Badge label={angle.engagement_level} />
        </div>
      </div>

      {/* Example tweet */}
      <div className="p-3 rounded-lg bg-surface-2 border border-white/8 relative group">
        <SectionLabel>example tweet</SectionLabel>
        <p className="mt-1 text-sm text-ink leading-relaxed">{angle.example_tweet}</p>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={angle.example_tweet} />
        </div>
      </div>

      <p className="text-xs text-muted italic">↳ {angle.why_its_trending}</p>

      <div className="space-y-2">
        <SectionLabel>suggested replies ({angle.suggested_replies.length})</SectionLabel>
        {angle.suggested_replies.map((reply, i) => (
          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-surface-2 border border-white/6 group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge label={reply.label} />
                <span className="text-[10px] font-mono text-muted">{reply.tone}</span>
                <span className={`text-[10px] font-mono ${reply.character_count > 250 ? "text-warn" : "text-ok"}`}>{reply.character_count}c</span>
              </div>
              <p className="text-xs text-ink/80 leading-relaxed">{reply.text}</p>
            </div>
            <CopyButton text={reply.text} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReplyCard({ reply, index }: { reply: SuggestedReply; index: number }) {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted">#{index}</span>
          <Badge label={reply.label} />
          <Badge label={reply.tone} />
          <span className={`text-xs font-mono ${reply.character_count > 250 ? "text-warn" : "text-ok"}`}>{reply.character_count}c</span>
        </div>
        <CopyButton text={reply.text} />
      </div>
      <div className="p-3 rounded-lg bg-surface-2 border border-white/8">
        <p className="text-sm text-ink leading-relaxed">{reply.text}</p>
      </div>
      <p className="text-xs text-muted leading-relaxed italic">↳ {reply.why_it_works}</p>
    </Card>
  );
}
