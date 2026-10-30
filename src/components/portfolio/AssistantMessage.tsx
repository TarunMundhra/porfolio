"use client";

import type { ReactNode } from "react";

const APPROVED_URLS = new Set([
  "https://github.com/TarunMundhra",
  "https://linkedin.com/in/tarun-mundhra-0a0a5629a",
  "/Tarun-Mundhra-Resume.pdf",
]);

function isApprovedUrl(url: string): boolean {
  if (APPROVED_URLS.has(url)) return true;
  return /^https:\/\/github\.com\/(?:TarunMundhra|KGP-Presence|GC-OpenSoft-2026)(?:\/[\w./-]+)?$/.test(url);
}

function renderMarkdown(value: string): ReactNode[] {
  const withoutHtml = value.replace(/<[^>]*>/g, "");
  const nodes: ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(withoutHtml))) {
    if (match.index > cursor) nodes.push(withoutHtml.slice(cursor, match.index));
    if (match[2] && match[3] && isApprovedUrl(match[3])) {
      nodes.push(
        <a
          key={`${match.index}-${match[3]}`}
          href={match[3]}
          target="_blank"
          rel="noreferrer noopener"
          className="text-emerald-300 underline underline-offset-2"
        >
          {match[2]}
        </a>,
      );
    } else if (match[2]) {
      nodes.push(match[2]);
    } else if (match[4]) {
      nodes.push(<strong key={`${match.index}-strong`}>{match[4]}</strong>);
    } else {
      nodes.push(
        <code key={`${match.index}-code`} className="rounded bg-white/10 px-1 py-0.5 text-xs">
          {match[5]}
        </code>,
      );
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < withoutHtml.length) nodes.push(withoutHtml.slice(cursor));
  return nodes;
}

export default function AssistantMessage({
  content,
  role,
  streaming = false,
}: {
  content: string;
  role: "user" | "assistant" | "error";
  streaming?: boolean;
}) {
  return (
    <div
      className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
        role === "user"
          ? "ml-auto bg-emerald-500/20 text-emerald-50"
          : role === "error"
            ? "border border-red-400/30 bg-red-500/10 text-red-100"
            : "bg-white/[0.07] text-slate-200"
      }`}
      data-message-role={role}
    >
      {renderMarkdown(content)}
      {streaming && <span aria-label="Assistant is typing" className="ml-1 inline-block animate-pulse">▌</span>}
    </div>
  );
}
