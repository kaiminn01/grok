"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button, Card, CopyButton, ErrorBox, SectionLabel, Textarea } from "@/components/ui";
import type { GrokMessage } from "@/lib/grok";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "What are the main prediction market platforms and their key differences?",
  "What's the current narrative around Base ecosystem growth?",
  "How do KOL programs typically work in DeFi?",
  "What are effective growth tactics for new crypto protocols in SEA?",
  "Explain the competitive landscape for AI agent platforms in 2025.",
];

// Simple markdown-to-HTML renderer for assistant output
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hlu]|<block|<hr|<p)(.+)$/gm, '<p>$1</p>');
}

export default function AssistantTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (content?: string) => {
    const text = (content ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })) as GrokMessage[],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");

      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Chat area */}
      <div className="flex-1 min-h-0">
        {messages.length === 0 && !loading ? (
          <div className="space-y-4">
            {/* Welcome */}
            <div className="text-center py-8">
              <div className="text-3xl mb-3 opacity-30">◈</div>
              <p className="text-sm text-muted font-mono">grok research assistant</p>
              <p className="text-xs text-muted/60 mt-1">ask anything about the crypto/Web3 ecosystem</p>
            </div>

            {/* Starter prompts */}
            <div>
              <SectionLabel>starter questions</SectionLabel>
              <div className="mt-2 space-y-2">
                {STARTER_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-surface-2 border border-white/6
                      text-xs font-mono text-muted hover:text-ink hover:border-accent/25 hover:bg-surface-3
                      transition-all duration-150 focus-ring"
                  >
                    → {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] text-accent font-mono">G</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && <ErrorBox message={error} />}

      {/* Input area */}
      <Card className="p-4 space-y-3 sticky bottom-0">
        <Textarea
          placeholder="ask a research question..."
          value={input}
          onChange={setInput}
          rows={3}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs font-mono text-muted hover:text-warn transition-colors"
              >
                clear chat
              </button>
            )}
            <span className="text-xs font-mono text-muted/40">
              {messages.length > 0 ? `${Math.ceil(messages.length / 2)} turns` : ""}
            </span>
          </div>
          <Button
            onClick={() => sendMessage()}
            loading={loading}
            disabled={!input.trim()}
          >
            {loading ? "Thinking..." : "Send →"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 animate-in ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-mono
        ${isUser
          ? "bg-surface-4 border border-white/12 text-muted"
          : "bg-accent/20 border border-accent/30 text-accent"
        }`}
      >
        {isUser ? "you" : "G"}
      </div>

      {/* Bubble */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
        {isUser ? (
          <div className="px-4 py-2.5 rounded-xl rounded-tr-sm bg-surface-3 border border-white/8">
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-surface-2 border border-white/6">
              <div
                className="prose-dark text-sm"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
              />
            </div>
            <div className="pl-1">
              <CopyButton text={message.content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
