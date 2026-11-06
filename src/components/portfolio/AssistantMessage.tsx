"use client";

import type { ReactNode } from "react";

const APPROVED_URLS = new Set([
  "/",
  "/#about",
  "/#experience",
  "/#projects",
  "/#contact",
  "https://github.com/TarunMundhra",
  "https://linkedin.com/in/tarun-mundhra-0a0a5629a",
  "/Tarun-Mundhra-Resume.pdf",
]);

export function isApprovedUrl(url: string): boolean {
  if (APPROVED_URLS.has(url)) return true;
  return /^https:\/\/github\.com\/(?:TarunMundhra|KGP-Presence|GC-OpenSoft-2026)(?:\/[\w./-]+)?$/.test(url);
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\[(\d+(?:,\s*\d+)*)\])/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    if (match[2] && match[3]) {
      const label = match[2];
      const url = match[3];
      if (isApprovedUrl(url)) {
        nodes.push(
          <a
            key={`${match.index}-${url}`}
            href={url}
            target={url.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer noopener"
            className="text-emerald-300 underline underline-offset-2 hover:text-emerald-200 transition-colors"
          >
            {label}
          </a>,
        );
      } else {
        nodes.push(label);
      }
    } else if (match[4]) {
      nodes.push(
        <strong key={`${match.index}-strong`} className="font-semibold text-white">
          {match[4]}
        </strong>,
      );
    } else if (match[5]) {
      nodes.push(
        <code key={`${match.index}-code`} className="rounded bg-white/10 px-1 py-0.5 text-xs font-mono text-emerald-200">
          {match[5]}
        </code>,
      );
    } else if (match[6]) {
      nodes.push(
        <span
          key={`${match.index}-cite`}
          className="inline-flex items-center justify-center mx-0.5 px-1 py-0.2 rounded text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 align-baseline"
        >
          [{match[6]}]
        </span>,
      );
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function formatListItem(item: string): string {
  const categoryMatch = /^([A-Za-z0-9&,/ -]+?):\s+(.*)$/.exec(item);
  if (categoryMatch && !categoryMatch[1].startsWith("**")) {
    return `**${categoryMatch[1]}**: ${categoryMatch[2]}`;
  }
  return item;
}

function renderMarkdown(value: string): ReactNode {
  const withoutHtml = value.replace(/<[^>]*>/g, "");
  if (!withoutHtml) return null;

  const normalized = withoutHtml
    .replace(/([:.;\]\)])\s*([*•\-])\s+/g, "$1\n$2 ")
    .replace(/\r\n/g, "\n");

  const lines = normalized.split("\n");
  const blocks: ReactNode[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      const items = currentListItems;
      currentListItems = [];
      blocks.push(
        <ul key={`list-${blocks.length}`} className="my-2 space-y-1.5 pl-0.5">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 leading-relaxed text-slate-200">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80" aria-hidden="true" />
              <div className="flex-1">{parseInline(formatListItem(item))}</div>
            </li>
          ))}
        </ul>,
      );
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    const listMatch = /^(?:[*•\-]|(?:\d+\.))\s+(.*)$/.exec(trimmed);
    if (listMatch) {
      currentListItems.push(listMatch[1]);
      continue;
    }

    flushList();

    const headingMatch = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      blocks.push(
        <h4 key={`heading-${blocks.length}`} className="mt-3 mb-1 font-semibold text-emerald-300 first:mt-0">
          {parseInline(headingMatch[2])}
        </h4>,
      );
      continue;
    }

    blocks.push(
      <p key={`p-${blocks.length}`} className="mb-2 leading-relaxed text-slate-200 last:mb-0">
        {parseInline(trimmed)}
      </p>,
    );
  }

  flushList();

  return <div className="space-y-1">{blocks}</div>;
}

export default function AssistantMessage({
  content,
  role,
  streaming = false,
  citations = [],
}: {
  content: string;
  role: "user" | "assistant" | "error";
  streaming?: boolean;
  citations?: ReadonlyArray<{ title: string; url: string; section?: string }>;
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
      {streaming && (
        <span aria-label="Assistant is typing" className="ml-1 inline-block animate-pulse text-emerald-400 font-bold">
          ▌
        </span>
      )}
      {role === "assistant" && citations.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
          {citations
            .filter((citation) => isApprovedUrl(citation.url))
            .filter(
              (citation, index, list) =>
                index ===
                list.findIndex(
                  (c) =>
                    c.url === citation.url &&
                    c.title === citation.title &&
                    (c.section ?? "") === (citation.section ?? ""),
                ),
            )
            .map((citation, index) => (
              <a
                key={`${citation.url}-${citation.title}-${citation.section ?? index}`}
                href={citation.url}
                target={citation.url.startsWith("http") ? "_blank" : undefined}
                rel={citation.url.startsWith("http") ? "noreferrer noopener" : undefined}
                className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200"
              >
                {citation.section ? `${citation.section}: ` : ""}{citation.title}
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
