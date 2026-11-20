"use client";

import Link from "next/link";
import { ExternalLink, Maximize2, PanelRight } from "lucide-react";
import { useEffect, useRef } from "react";
import AssistantMessage from "./AssistantMessage";
import { usePortfolioAssistant } from "./PortfolioAssistantProvider";

export const SUGGESTIONS = [
  "What projects has Tarun built?",
  "What is Tarun's professional experience?",
  "What technologies does Tarun use?",
  "How can I contact Tarun?",
];

const FOLLOW_UPS = [
  { label: "Architecture", question: "Give me a deeper look at Tarun's systems architecture work." },
  { label: "Leadership", question: "Give me a deeper look at Tarun's technical leadership experience." },
  { label: "Projects", question: "Give me a deeper look at Tarun's strongest projects." },
] as const;

export type AssistantSurface = "panel" | "modal" | "page";

export default function AssistantConversation({ surface, onSurfaceChange, onClose }: {
  surface: AssistantSurface;
  onSurfaceChange?: (surface: "panel" | "modal") => void;
  onClose?: () => void;
}) {
  const { question, setQuestion, messages, busy, error, lastQuestion, send, stop, clear } = usePortfolioAssistant();
  const listRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLInputElement>(null);

  useEffect(() => { promptRef.current?.focus(); }, []);
  useEffect(() => {
    if (busy && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);

  const latestMessage = messages.at(-1);
  const showFollowUps = !busy && latestMessage?.role === "assistant" && !latestMessage.streaming && latestMessage.content;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Tarun AI</p>
          <h2 id="assistant-title" className="mt-1 text-lg font-semibold text-white">Portfolio assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          {onSurfaceChange && <>
            <button type="button" onClick={() => onSurfaceChange("panel")} aria-label="Side panel" aria-pressed={surface === "panel"} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white aria-pressed:bg-emerald-400/15 aria-pressed:text-emerald-200"><PanelRight size={17} /></button>
            <button type="button" onClick={() => onSurfaceChange("modal")} aria-label="Focus mode" aria-pressed={surface === "modal"} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white aria-pressed:bg-emerald-400/15 aria-pressed:text-emerald-200"><Maximize2 size={17} /></button>
          </>}
          {surface !== "page" && <Link href="/assistant" aria-label="Open full page" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><ExternalLink size={17} /></Link>}
          {onClose && <button type="button" onClick={onClose} aria-label="Close assistant" className="rounded-lg px-2 py-1 text-xl text-slate-300 hover:bg-white/10">×</button>}
        </div>
      </header>

      <div ref={listRef} className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {messages.length === 0 && <div className="space-y-2">
          <p className="text-xs text-slate-400">Try a question:</p>
          {SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-slate-200 transition hover:border-emerald-300/20 hover:bg-white/10">{suggestion}</button>)}
        </div>}
        {messages.map((message) => <AssistantMessage key={message.id} {...message} />)}
        {showFollowUps && <div className="flex flex-wrap gap-2" aria-label="Explore more about Tarun">
          {FOLLOW_UPS.map((followUp) => <button key={followUp.label} type="button" onClick={() => void send(followUp.question)} className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-400/20">{followUp.label}</button>)}
        </div>}
        {error && !messages.some((message) => message.role === "error") && <AssistantMessage role="error" content={error} />}
      </div>

      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void send(); }}>
          <input ref={promptRef} aria-label="Question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about Tarun's work…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50" />
          {busy ? <button type="button" onClick={stop} aria-label="Stop generating" className="rounded-xl border border-amber-300/30 px-3 text-xs text-amber-100">Stop</button> : <button type="submit" aria-label="Send question" className="rounded-xl bg-emerald-500/90 px-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">Send</button>}
        </form>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Questions stay in this browser session.</span>
          <div className="flex gap-2">
            {lastQuestion && <button type="button" onClick={() => void send(lastQuestion)} className="underline underline-offset-2">Retry</button>}
            <button type="button" onClick={clear} aria-label="Clear conversation" className="underline underline-offset-2">Clear</button>
          </div>
        </div>
        <p className="text-[11px] leading-4 text-slate-500">Privacy note: your question is sent to answer this request and is not stored in the assistant UI.</p>
      </div>
    </div>
  );
}
