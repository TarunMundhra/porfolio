"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AssistantConversation, { type AssistantSurface } from "./AssistantConversation";
import { PortfolioAssistantProvider, useOptionalPortfolioAssistant, usePortfolioAssistant } from "./PortfolioAssistantProvider";

function PortfolioAssistantShell() {
  const { stop } = usePortfolioAssistant();
  const [open, setOpen] = useState(false);
  const [surface, setSurface] = useState<Exclude<AssistantSurface, "page">>("panel");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("portfolio-assistant-surface");
      if (saved === "panel" || saved === "modal") setSurface(saved);
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
  }, []);

  useLayoutEffect(() => {
    if (open) {
      openedRef.current = true;
      return;
    }
    if (openedRef.current) launcherRef.current?.focus();
  }, [open]);

  const close = () => {
    stop();
    setOpen(false);
  };

  const changeSurface = (next: "panel" | "modal") => {
    setSurface(next);
    try {
      window.localStorage.setItem("portfolio-assistant-surface", next);
    } catch {
      // Layout preference is optional.
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, input, [href], select, textarea, [tabindex]:not([tabindex='-1'])",
      ) ?? []).filter((element) => !element.hasAttribute("disabled"));
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
  }, [open, stop]);

  return <>
    <button
      ref={launcherRef}
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Ask about Tarun"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full border border-emerald-300/25 bg-slate-950/90 p-2 pr-4 text-left shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-emerald-300/45 hover:bg-slate-900 motion-reduce:transform-none"
    >
      <span className="relative shrink-0">
        <Image src="/Tarun.jpeg" alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-400/40" />
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[11px] font-medium text-emerald-300">Tarun AI · online</span>
        <span className="block text-sm font-semibold text-white">Curious about my work?</span>
      </span>
    </button>

    {open && <div className="fixed inset-0 z-50" role="presentation">
      <button aria-label="Close assistant" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={close} />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        data-assistant-surface={surface}
        className={surface === "panel"
          ? "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-950/95 p-5 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-right"
          : "absolute left-1/2 top-1/2 flex h-[min(760px,calc(100%-2rem))] w-[min(900px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border border-white/10 bg-slate-950/95 p-5 shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 sm:p-6"
        }
      >
        <AssistantConversation surface={surface} onSurfaceChange={changeSurface} onClose={close} />
      </section>
    </div>}
  </>;
}

export default function PortfolioAssistant() {
  const context = useOptionalPortfolioAssistant();
  if (context) return <PortfolioAssistantShell />;
  return <PortfolioAssistantProvider><PortfolioAssistantShell /></PortfolioAssistantProvider>;
}
