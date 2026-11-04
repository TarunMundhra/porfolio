"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import AssistantMessage from "./AssistantMessage";

type Message = { id: string; role: "user" | "assistant" | "error"; content: string; streaming?: boolean };
type Citation = { title: string; url: string; section?: string };
type AssistantMessageState = Message & { citations?: Citation[] };

const SUGGESTIONS = [
  "What projects has Tarun built?",
  "What is Tarun's professional experience?",
  "What technologies does Tarun use?",
  "How can I contact Tarun?",
];

function safeError(): string {
  return "Unable to complete that response. Please try again.";
}

export default function PortfolioAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<AssistantMessageState[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const promptRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastQuestionRef = useRef("");
  const readerRef = useRef<{ requestId: number; reader: ReadableStreamDefaultReader<Uint8Array> } | null>(null);
  const openedRef = useRef(false);
  const activeRequestRef = useRef<{ id: number; assistantId: string; controller: AbortController } | null>(null);
  const generationRef = useRef(0);

  const cleanupRequest = useCallback((requestId?: number) => {
    const active = activeRequestRef.current;
    if (!active || (requestId !== undefined && active.id !== requestId)) return;
    active.controller.abort();
    if (readerRef.current?.requestId === active.id) {
      void readerRef.current.reader.cancel();
      readerRef.current = null;
    }
    activeRequestRef.current = null;
    setBusy(false);
    setMessages((current) =>
      current.map((message) =>
        message.id === active.assistantId ? { ...message, streaming: false } : message,
      ),
    );
  }, []);

  useLayoutEffect(() => {
    if (open) {
      openedRef.current = true;
      promptRef.current?.focus();
      return;
    }
    if (openedRef.current) launcherRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cleanupRequest();
        setOpen(false);
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        document.querySelector('[role="dialog"]')?.querySelectorAll<HTMLElement>(
          "button, input, [href], select, textarea, [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      ).filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => () => cleanupRequest(), [cleanupRequest]);

  const stop = () => {
    cleanupRequest();
  };

  const send = async (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    const startedAt = performance.now();
    let firstResponseByteAt: number | undefined;
    let firstTokenAt: number | undefined;
    lastQuestionRef.current = trimmed;
    setQuestion("");
    setError("");
    const userId = `${Date.now()}-user`;
    const assistantId = `${Date.now()}-assistant`;
    const requestId = ++generationRef.current;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", content: trimmed },
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    activeRequestRef.current = { id: requestId, assistantId, controller };
    try {
      console.info("[chat] prompt_sent");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error("request failed");
      const reader = response.body.getReader();
      if (activeRequestRef.current?.id !== requestId || controller.signal.aborted) {
        await reader.cancel();
        return;
      }
      readerRef.current = { requestId, reader };
      const decoder = new TextDecoder();
      let buffer = "";
      let complete = false;
      while (!complete) {
        const { value: chunk, done } = await reader.read();
        if (firstResponseByteAt === undefined && chunk && chunk.byteLength > 0) {
          firstResponseByteAt = performance.now();
          console.info("[chat] first_response_byte", {
            elapsedMs: Math.round(firstResponseByteAt - startedAt),
          });
        }
        buffer += decoder.decode(chunk ?? new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (activeRequestRef.current?.id !== requestId || controller.signal.aborted) break;
          if (!line.trim()) continue;
          let event: { type?: string; value?: string; message?: string; citation?: Citation };
          try {
            event = JSON.parse(line) as typeof event;
          } catch {
            continue;
          }
          if (event.type === "token" && typeof event.value === "string") {
            if (firstTokenAt === undefined) {
              firstTokenAt = performance.now();
              console.info("[chat] first_token", {
                elapsedMs: Math.round(firstTokenAt - startedAt),
              });
            }
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId ? { ...message, content: message.content + event.value } : message,
              ),
            );
          } else if (event.type === "citation" && event.citation) {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, citations: [...(message.citations ?? []), event.citation!] }
                  : message,
              ),
            );
          } else if (event.type === "error") {
            throw new Error("assistant error");
          } else if (event.type === "done") {
            console.info("[chat] completed", {
              elapsedMs: Math.round(performance.now() - startedAt),
              timeToFirstResponseByteMs: firstResponseByteAt
                ? Math.round(firstResponseByteAt - startedAt)
                : null,
              timeToFirstTokenMs: firstTokenAt ? Math.round(firstTokenAt - startedAt) : null,
            });
            complete = true;
          }
        }
        if (done || activeRequestRef.current?.id !== requestId || controller.signal.aborted) complete = true;
      }
    } catch {
      if (!controller.signal.aborted && activeRequestRef.current?.id === requestId) {
        setError(safeError());
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, role: "error", content: safeError(), streaming: false } : message,
          ),
        );
      }
    } finally {
      if (activeRequestRef.current?.id === requestId) {
        setMessages((current) =>
          current.map((message) => (message.id === assistantId ? { ...message, streaming: false } : message)),
        );
        setBusy(false);
        if (readerRef.current?.requestId === requestId) readerRef.current = null;
        abortRef.current = null;
        activeRequestRef.current = null;
      }
    }
  };

  const clear = () => {
    cleanupRequest();
    setMessages([]);
    setError("");
  };

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask about Tarun"
        className="fixed bottom-5 right-5 z-40 rounded-full border border-emerald-300/30 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-50 shadow-lg shadow-emerald-950/30 backdrop-blur-xl transition hover:bg-emerald-500/30"
      >
        Ask about Tarun
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="presentation">
          <button aria-label="Close assistant" className="absolute inset-0 bg-slate-950/60" onClick={() => { cleanupRequest(); setOpen(false); }} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-title"
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-950/95 p-5 shadow-2xl backdrop-blur-xl motion-safe:animate-in motion-safe:slide-in-from-right"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 id="assistant-title" className="text-lg font-semibold text-white">Portfolio assistant</h2>
                <p className="text-xs text-slate-400">Ask about Tarun&apos;s work, experience, or projects.</p>
              </div>
              <button type="button" onClick={() => { cleanupRequest(); setOpen(false); }} aria-label="Close assistant" className="rounded-lg px-2 py-1 text-xl text-slate-300 hover:bg-white/10">×</button>
            </header>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Try a question:</p>
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10">
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((message) => <AssistantMessage key={message.id} {...message} citations={message.citations} />)}
              {error && !messages.some((message) => message.role === "error") && <AssistantMessage role="error" content={error} />}
            </div>
            <div className="mt-4 space-y-2">
              <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void send(); }}>
                <input ref={promptRef} aria-label="Question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                {busy ? (
                  <button type="button" onClick={stop} aria-label="Stop generating" className="rounded-xl border border-amber-300/30 px-3 text-xs text-amber-100">Stop</button>
                ) : (
                  <button type="submit" aria-label="Send question" className="rounded-xl bg-emerald-500/80 px-3 text-sm font-semibold text-slate-950">Send</button>
                )}
              </form>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Questions stay in this browser session.</span>
                <div className="flex gap-2">
                  {lastQuestionRef.current && <button type="button" onClick={() => void send(lastQuestionRef.current)} className="underline underline-offset-2">Retry</button>}
                  <button type="button" onClick={clear} aria-label="Clear conversation" className="underline underline-offset-2">Clear</button>
                </div>
              </div>
              <p className="text-[11px] leading-4 text-slate-500">Privacy note: your question is sent to answer this request and is not stored in the assistant UI.</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
