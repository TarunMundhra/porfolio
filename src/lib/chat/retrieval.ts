import { createHash } from "node:crypto";
import type { KnowledgeDocument, RetrievedChunk } from "./contracts";

export const CHUNK_MAX_CHARACTERS = 500;
export const CHUNK_OVERLAP_CHARACTERS = 60;

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function splitSections(text: string, defaultSection: string): Array<{ section: string; text: string }> {
  const sections: Array<{ section: string; text: string }> = [];
  let current = defaultSection;
  let buffer: string[] = [];

  const flush = () => {
    const value = normalizeWhitespace(buffer.join("\n"));
    if (value) sections.push({ section: current, text: value });
    buffer = [];
  };

  for (const line of text.split("\n")) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
    if (heading) {
      flush();
      current = heading[1].trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

function splitBlock(text: string): string[] {
  if (text.length <= CHUNK_MAX_CHARACTERS) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_MAX_CHARACTERS, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);
      if (boundary > start + 100) end = boundary;
    }
    chunks.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = Math.max(start + 1, end - CHUNK_OVERLAP_CHARACTERS);
  }
  return chunks;
}

export function chunkDocument(document: KnowledgeDocument): RetrievedChunk[] {
  const chunks: RetrievedChunk[] = [];
  for (const section of splitSections(document.text, document.section ?? document.title)) {
    for (const text of splitBlock(section.text)) {
      const contentHash = createHash("sha256").update(text, "utf8").digest("hex");
      chunks.push({
        id: createHash("sha256")
          .update(`${document.sourceId}\n${section.section}\n${contentHash}`, "utf8")
          .digest("hex"),
        sourceId: document.sourceId,
        title: document.title,
        url: document.url,
        section: section.section,
        text,
        similarity: 0,
        contentHash,
        sourcePath: document.sourcePath,
      });
    }
  }
  return chunks;
}

export function selectRelevantChunks(
  chunks: ReadonlyArray<RetrievedChunk>,
  options: { limit: number; minimumSimilarity: number },
): RetrievedChunk[] {
  if (options.limit <= 0) return [];
  return chunks
    .filter((chunk) => chunk.similarity >= options.minimumSimilarity)
    .sort((left, right) => right.similarity - left.similarity || left.id.localeCompare(right.id))
    .slice(0, options.limit);
}
