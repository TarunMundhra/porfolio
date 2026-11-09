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

function splitBlock(text: string): Array<{ text: string; offset: number }> {
  if (text.length <= CHUNK_MAX_CHARACTERS) return [{ text, offset: 0 }];
  const chunks: Array<{ text: string; offset: number }> = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_MAX_CHARACTERS, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);
      if (boundary > start + 100) end = boundary;
    }
    chunks.push({ text: text.slice(start, end).trim(), offset: start });
    if (end >= text.length) break;
    start = Math.max(start + 1, end - CHUNK_OVERLAP_CHARACTERS);
  }
  return chunks;
}

export function chunkDocument(document: KnowledgeDocument): RetrievedChunk[] {
  const chunks: RetrievedChunk[] = [];
  for (const section of splitSections(document.text, document.section ?? document.title)) {
    for (const part of splitBlock(section.text)) {
      const text = part.text;
      const contentHash = createHash("sha256").update(text, "utf8").digest("hex");
      const chunkOrdinal = chunks.length;
      chunks.push({
        id: createHash("sha256")
          .update(`${document.sourceId}\n${section.section}\n${part.offset}\n${chunkOrdinal}\n${contentHash}`, "utf8")
          .digest("hex"),
        sourceId: document.sourceId,
        title: document.title,
        url: document.url,
        section: section.section,
        text,
        similarity: 0,
        contentHash,
        sourcePath: document.sourcePath,
        chunkOrdinal,
        sourceOffset: part.offset,
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

export const HR_OR_PROFILE_PATTERN =
  /\b(hire|hiring|candidate|fit|readiness|qualification|qualifications|recommend|recruiter|interview|strength|strengths|strongest|superpower|superpowers|weakness|weaknesses|improve|improvement|growth|flaw|flaws|limitation|limitations|yourself|who are you|about you|tell me about you|background|journey|transition|motivation|passion|geophysics|achievement|achievements)\b|why.*(?:software|engineering|engineer|developer|coding|code|programming)|(?:took|take|taken|choose|chose|chosen|entered|enter|switch|switched|transition|transitioned)\s+(?:up\s+)?(?:the\s+)?(?:software|tech|programming|coding|engineering)/i;

export function isCandidateProfileQuery(question: string): boolean {
  return HR_OR_PROFILE_PATTERN.test(question.trim());
}

export function getCandidateProfileFallbackChunks(): RetrievedChunk[] {
  return [
    {
      id: "profile-fallback-about",
      sourceId: "about",
      title: "About Tarun Mundhra",
      url: "/#about",
      section: "Education & Background",
      similarity: 1,
      text: "Tarun Mundhra is a Software Development Engineer with a B.S. (Hons.) in Exploration Geophysics from IIT Kharagpur. He transitioned from computational geophysics, linear algebra, and data structures into production software engineering, demonstrating rapid self-directed mastery with 83 production commits (+15,300 lines of code) and real-world distributed architectures. He focuses on high-impact systems architecture, backend engineering, and full-stack development.",
    },
    {
      id: "profile-fallback-experience-juryassist",
      sourceId: "experience",
      title: "Professional experience",
      url: "/#experience",
      section: "JuryAssist - Founding Engineer",
      similarity: 1,
      text: "Founding Engineer at JuryAssist (Veritos UK legal tech platform), scaling adoption to 10,294 active users. Built 0-to-1 systems architecture with zero-knowledge 6-LLM consensus, cutting legal contract ingestion latency by >94% (<20s for 800+ pages via bulk ONNX parallelization), and implemented sub-50ms hybrid pgvector/BM25 search with distributed state locking.",
    },
    {
      id: "profile-fallback-experience-rebac",
      sourceId: "experience",
      title: "Professional experience",
      url: "/#experience",
      section: "Quick Dry Cleaning Software - SDE",
      similarity: 1,
      text: "Software Development Engineer at Quick Dry Cleaning Software (DC Web Services). Re-architected the access control model from flat user-store mapping to hierarchical ReBAC with PostgreSQL Row-Level Security (RLS) across 6 microservices, eliminating O(N) database record duplication. Cut hot-path authorization latency to near-zero with in-memory caching and authored 83 production commits (+15,300 lines of code) with comprehensive Vitest coverage.",
    },
    {
      id: "profile-fallback-projects-leadership",
      sourceId: "projects",
      title: "Portfolio projects",
      url: "/#projects",
      section: "Leadership & Mobile Deployment",
      similarity: 1,
      text: "Led a 20-member cross-functional team in Go, Redis, and TimescaleDB for an algorithmic trading simulator. Deployed KGP Presence mobile application to the Google Play Store with 100+ active installs. Proven track record in high-throughput systems, event pipelines with Temporal.io and BullMQ/Redis, and end-to-end full-stack delivery.",
    },
  ];
}

