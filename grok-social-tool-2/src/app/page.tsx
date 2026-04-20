"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ClientProvider, useClient, CLIENTS, type ClientId } from "@/lib/client-context";

const TrendsTab    = dynamic(() => import("@/components/TrendsTab"),   { ssr: false });
const RepliesTab   = dynamic(() => import("@/components/RepliesTab"),  { ssr: false });
const KOLTab       = dynamic(() => import("@/components/KOLTab"),      { ssr: false });
const PartnersTab  = dynamic(() => import("@/components/PartnersTab"), { ssr: false });
const AssistantTab = dynamic(() => import("@/components/AssistantTab"),{ ssr: false });

type TabId = "trends" | "replies" | "kol" | "partners" | "assistant";

const TABS = [
  { id: "trends" as TabId,    label: "Trends",      icon: "↯" },
  { id: "replies" as TabId,   label: "Replies",     icon: "↩" },
  { id: "kol" as TabId,       label: "KOL Search",  icon: "◎" },
  { id: "partners" as TabId,  label: "Partners",    icon: "◬" },
  { id: "assistant" as TabId, label: "Assistant",   icon: "◈" },
];

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("trends");
  const { activeClient, setActiveClientId } = useClient();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/6 bg-surface-0/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <span className="text-accent text-xs font-mono font-bold">E</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-ink tracking-tight">Emerge Intel</h1>
              <p className="text-[10px] text-muted font-mono hidden sm:block">social intelligence · grok-3</p>
            </div>
          </div>

          {/* Client switcher */}
          <div className="flex items-center gap-1.5">
            {CLIENTS.map((client) => (
              <button key={client.id} onClick={() => setActiveClientId(client.id as ClientId)}
                className={`px-3 py-1 rounded-full text-xs font-mono border transition-all duration-150
                  ${activeClient.id === client.id ? client.color : "border-transparent text-muted hover:text-ink"}`}>
                {client.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-slow" />
            <span className="text-[10px] font-mono text-muted hidden sm:block">xAI live</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0.5 overflow-x-auto pb-px">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition-all
                  ${activeTab === tab.id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink/70 hover:border-white/15"}`}>
                <span className={activeTab === tab.id ? "text-accent" : ""}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {activeTab === "trends"    && <TrendsTab />}
        {activeTab === "replies"   && <RepliesTab />}
        {activeTab === "kol"       && <KOLTab />}
        {activeTab === "partners"  && <PartnersTab />}
        {activeTab === "assistant" && (
          <div className="flex flex-col" style={{ minHeight: "calc(100vh - 130px)" }}>
            <AssistantTab />
          </div>
        )}
      </main>

      <footer className="border-t border-white/4 py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-[10px] font-mono text-muted/40">emerge growth & marketing · internal tool</p>
          <a href="https://www.notion.so/4bd33c0fbb6b4c8da24c0ee32efbf5b6" target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-mono text-muted/40 hover:text-accent transition-colors">
            → KOL Tracker in Notion ↗
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <ClientProvider>
      <AppShell />
    </ClientProvider>
  );
}
