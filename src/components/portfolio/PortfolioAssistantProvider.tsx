"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type Citation = { title: string; url: string; section?: string; indices?: number[] };
export type AssistantMessageState = {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  streaming?: boolean;
  citations?: Citation[];
};

type AssistantContextValue = {
  question: string;
  setQuestion: (question: string) => void;
  messages: AssistantMessageState[];
  busy: boolean;
  error: string;
  lastQuestion: string;
  send: (value?: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
};

const PortfolioAssistantContext = createContext<AssistantContextValue | null>(null);
const safeError = () => "Unable to complete that response. Please try again.";

export function PortfolioAssistantProvider({ children }: { children: ReactNode }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<AssistantMessageState[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastQuestionRef = useRef("");
  const readerRef = useRef<{ requestId: number; reader: ReadableStreamDefaultReader<Uint8Array> } | null>(null);
  const activeRequestRef = useRef<{ id: number; assistantId: string; controller: AbortController } | null>(null);
  const generationRef = useRef(0);
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetTextRef = useRef("");
  const displayedTextRef = useRef("");

  const stopTypewriter = useCallback(() => {
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    typewriterTimerRef.current = null;
  }, []);

  const cleanupRequest = useCallback((requestId?: number) => {
    const active = activeRequestRef.current;
    if (!active || (requestId !== undefined && active.id !== requestId)) return;
    stopTypewriter();
    const finalContent = targetTextRef.current || displayedTextRef.current;
    displayedTextRef.current = finalContent;
    active.controller.abort();
    if (readerRef.current?.requestId === active.id) {
      void readerRef.current.reader.cancel();
      readerRef.current = null;
    }
    activeRequestRef.current = null;
    setBusy(false);
    setMessages((current) => current.map((message) =>
      message.id === active.assistantId ? { ...message, content: finalContent, streaming: false } : message,
    ));
  }, [stopTypewriter]);

  useEffect(() => () => cleanupRequest(), [cleanupRequest]);

  const send = useCallback(async (value?: string) => {
    const trimmed = (value ?? question).trim();
    if (!trimmed || busy) return;
    const startedAt = performance.now();
    let firstResponseByteAt: number | undefined;
    let firstTokenAt: number | undefined;
    lastQuestionRef.current = trimmed;
    setQuestion("");
    setError("");
    stopTypewriter();
    targetTextRef.current = "";
    displayedTextRef.current = "";
    const userId = `${Date.now()}-user`;
    const assistantId = `${Date.now()}-assistant`;
    const requestId = ++generationRef.current;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", content: trimmed },
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setBusy(true);

    const flushTypewriter = () => {
      const target = targetTextRef.current;
      displayedTextRef.current = target;
      setMessages((current) => current.map((message) =>
        message.id === assistantId ? { ...message, content: target } : message,
      ));
    };
    const advanceTypewriter = () => {
      const target = targetTextRef.current;
      const current = displayedTextRef.current;
      if (current.length >= target.length) return;
      const remaining = target.length - current.length;
      const charsToAdd = remaining > 100 ? Math.ceil(remaining / 6) : remaining > 40 ? 4 : remaining > 15 ? 2 : 1;
      const next = target.slice(0, current.length + charsToAdd);
      displayedTextRef.current = next;
      setMessages((currentMessages) => currentMessages.map((message) =>
        message.id === assistantId ? { ...message, content: next } : message,
      ));
    };

    const controller = new AbortController();
    const drainTypewriter = async () => {
      stopTypewriter();
      while (displayedTextRef.current.length < targetTextRef.current.length && activeRequestRef.current?.id === requestId && !controller.signal.aborted) {
        advanceTypewriter();
        await new Promise((resolve) => setTimeout(resolve, 16));
      }
    };
    typewriterTimerRef.current = setInterval(advanceTypewriter, 16);
    activeRequestRef.current = { id: requestId, assistantId, controller };

    try {
      console.info("[chat] prompt_sent");
      const response = await fetch("/api/chat/", {
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
          console.info("[chat] first_response_byte", { elapsedMs: Math.round(firstResponseByteAt - startedAt) });
        }
        buffer += decoder.decode(chunk ?? new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (activeRequestRef.current?.id !== requestId || controller.signal.aborted) break;
          if (!line.trim()) continue;
          let event: { type?: string; value?: string; message?: string; citation?: Citation; code?: string };
          try {
            event = JSON.parse(line) as typeof event;
          } catch {
            continue;
          }
          if (event.type === "status" && event.message && firstTokenAt === undefined) {
            setMessages((current) => current.map((message) =>
              message.id === assistantId ? { ...message, content: event.message! } : message,
            ));
          } else if (event.type === "token" && typeof event.value === "string") {
            if (firstTokenAt === undefined && event.value.length > 0) {
              firstTokenAt = performance.now();
              console.info("[chat] first_token", { elapsedMs: Math.round(firstTokenAt - startedAt) });
              targetTextRef.current = "";
              displayedTextRef.current = "";
            }
            targetTextRef.current += event.value;
            advanceTypewriter();
          } else if (event.type === "citation" && event.citation) {
            setMessages((current) => current.map((message) =>
              message.id === assistantId ? { ...message, citations: [...(message.citations ?? []), event.citation!] } : message,
            ));
          } else if (event.type === "error") {
            stopTypewriter();
            if (event.code === "refused" && event.message) {
              targetTextRef.current = event.message;
              displayedTextRef.current = event.message;
              setMessages((current) => current.map((message) =>
                message.id === assistantId ? { ...message, content: event.message!, streaming: false } : message,
              ));
              complete = true;
              break;
            }
            throw new Error("assistant error");
          } else if (event.type === "done") {
            await drainTypewriter();
            flushTypewriter();
            setMessages((current) => current.map((message) =>
              message.id === assistantId ? { ...message, streaming: false } : message,
            ));
            console.info("[chat] completed", {
              elapsedMs: Math.round(performance.now() - startedAt),
              timeToFirstResponseByteMs: firstResponseByteAt ? Math.round(firstResponseByteAt - startedAt) : null,
              timeToFirstTokenMs: firstTokenAt ? Math.round(firstTokenAt - startedAt) : null,
            });
            complete = true;
          }
        }
        if (done || activeRequestRef.current?.id !== requestId || controller.signal.aborted) complete = true;
      }
    } catch {
      stopTypewriter();
      if (!controller.signal.aborted && activeRequestRef.current?.id === requestId) {
        const safeMessage = safeError();
        targetTextRef.current = safeMessage;
        displayedTextRef.current = safeMessage;
        setError(safeMessage);
        setMessages((current) => current.map((item) =>
          item.id === assistantId ? { ...item, role: "error", content: safeMessage, streaming: false } : item,
        ));
      }
    } finally {
      stopTypewriter();
      if (activeRequestRef.current?.id === requestId) {
        flushTypewriter();
        setMessages((current) => current.map((message) =>
          message.id === assistantId ? { ...message, streaming: false } : message,
        ));
        setBusy(false);
        if (readerRef.current?.requestId === requestId) readerRef.current = null;
        activeRequestRef.current = null;
      }
    }
  }, [busy, question, stopTypewriter]);

  const clear = useCallback(() => {
    cleanupRequest();
    setMessages([]);
    setError("");
  }, [cleanupRequest]);
  const stop = useCallback(() => cleanupRequest(), [cleanupRequest]);

  return (
    <PortfolioAssistantContext.Provider value={{
      question,
      setQuestion,
      messages,
      busy,
      error,
      lastQuestion: lastQuestionRef.current,
      send,
      stop,
      clear,
    }}>
      {children}
    </PortfolioAssistantContext.Provider>
  );
}

export function usePortfolioAssistant() {
  const value = useContext(PortfolioAssistantContext);
  if (!value) throw new Error("usePortfolioAssistant must be used inside PortfolioAssistantProvider");
  return value;
}

export function useOptionalPortfolioAssistant() {
  return useContext(PortfolioAssistantContext);
}
