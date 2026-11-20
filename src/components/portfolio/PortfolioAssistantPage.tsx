"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import AssistantConversation from "./AssistantConversation";

export default function PortfolioAssistantPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(17,153,142,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.1),transparent_34%)]" />
        <div className="absolute inset-0 bg-grid opacity-70" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft size={17} />
          Back to portfolio
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Image src="/Tarun.jpeg" alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover ring-2 ring-emerald-400/40" />
          Tarun AI
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-7xl gap-8 px-5 pb-6 sm:px-8 lg:grid-cols-[minmax(260px,0.72fr)_minmax(520px,1.28fr)] lg:items-center">
        <section className="max-w-xl py-6 lg:py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Recruiter shortcut</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Ask Tarun&apos;s portfolio AI</h1>
          <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
            Explore Tarun&apos;s architecture, production impact, and role fit through concise answers grounded in his portfolio evidence.
          </p>
          <ul className="mt-7 space-y-3 text-sm text-slate-300">
            {[
              "Compare flagship projects and their measurable impact",
              "Understand backend, AI, and distributed-systems experience",
              "Open the supporting portfolio or resume source instantly",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-7 text-xs leading-5 text-slate-500">
            Answers are generated from approved portfolio material. Visitor questions are not published on this page.
          </p>
        </section>

        <section aria-label="Portfolio AI conversation" className="flex h-[min(780px,calc(100vh-110px))] min-h-[620px] flex-col rounded-3xl border border-white/10 bg-slate-950/85 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
          <AssistantConversation surface="page" />
        </section>
      </main>
    </div>
  );
}
