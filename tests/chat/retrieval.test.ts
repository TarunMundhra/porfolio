import { describe, expect, it } from "vitest";
import { chunkDocument, selectRelevantChunks } from "@/lib/chat/retrieval";
import { KNOWLEDGE_MANIFEST } from "@/data/knowledge/manifest";
import {
  extractPdfText,
  indexKnowledge,
  runIndexCommand,
  type KnowledgeIndexDatabase,
} from "../../scripts/index-knowledge";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

describe("knowledge retrieval", () => {
  it("creates stable overlapping chunks with source metadata", () => {
    const document = {
      sourceId: "resume",
      title: "Tarun Mundhra Resume",
      url: "/Tarun-Mundhra-Resume.pdf",
      text: "A".repeat(900),
    } as const;

    const chunks = chunkDocument(document);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.sourceId === "resume")).toBe(true);
    expect(chunks.every((chunk) => chunk.text.length <= 500)).toBe(true);
    expect(new Set(chunks.map((chunk) => chunk.id)).size).toBe(chunks.length);
    expect(chunks).toEqual(chunkDocument(document));
  });

  it("keeps repeated chunk content distinct by ordinal and offset", () => {
    const text = "repeat ".repeat(80);
    const chunks = chunkDocument({ sourceId: "about", title: "About", url: "/#about", text: `# A\n\n${text}\n# A\n\n${text}` });
    expect(new Set(chunks.map((chunk) => chunk.id)).size).toBe(chunks.length);
    expect(chunks.some((chunk, index) => chunks.slice(index + 1).some((other) => other.contentHash === chunk.contentHash))).toBe(true);
  });

  it("preserves semantic sections when splitting content", () => {
    const chunks = chunkDocument({
      sourceId: "about",
      title: "About",
      url: "/#about",
      text: "# About\n\n" + "A".repeat(700) + "\n\n# Experience\n\n" + "B".repeat(700),
    });

    expect(chunks.some((chunk) => chunk.section === "About")).toBe(true);
    expect(chunks.some((chunk) => chunk.section === "Experience")).toBe(true);
    expect(chunks.every((chunk) => chunk.section === "About" || chunk.section === "Experience")).toBe(true);
  });

  it("returns no evidence when the best similarity is below the threshold", () => {
    expect(
      selectRelevantChunks(
        [{ id: "one", sourceId: "about", title: "About", url: "/#about", text: "trading", similarity: 0.41 }],
        { limit: 4, minimumSimilarity: 0.72 },
      ),
    ).toEqual([]);
  });

  it("sorts by similarity and applies the limit", () => {
    const chunks = [
      { id: "low", sourceId: "about", title: "About", url: "/#about", text: "low", similarity: 0.8 },
      { id: "high", sourceId: "about", title: "About", url: "/#about", text: "high", similarity: 0.95 },
      { id: "middle", sourceId: "about", title: "About", url: "/#about", text: "middle", similarity: 0.9 },
    ];

    expect(selectRelevantChunks(chunks, { limit: 2, minimumSimilarity: 0.75 }).map((chunk) => chunk.id)).toEqual([
      "high",
      "middle",
    ]);
  });

  it("allowlists only approved public sources", () => {
    expect(KNOWLEDGE_MANIFEST.map((source) => source.sourcePath)).toEqual([
      "src/components/portfolio/HeroSection.tsx",
      "src/components/portfolio/AboutPage.tsx",
      "src/components/portfolio/ExperiencePage.tsx",
      "src/components/portfolio/ProjectsPage.tsx",
      "src/components/portfolio/ContactPage.tsx",
      "public/Tarun-Mundhra-Resume.pdf",
    ]);
    expect(KNOWLEDGE_MANIFEST.every((source) => !/(transcript|node_modules|\.next|private|generated)/i.test(source.sourcePath))).toBe(true);
  });

  it("extracts text from the tracked resume PDF", async () => {
    const pdf = await readFile(resolve(process.cwd(), "public/Tarun-Mundhra-Resume.pdf"));
    const text = await extractPdfText(pdf);
    expect(text.length).toBeGreaterThan(100);
    expect(text).toMatch(/Tarun|Mundhra/i);
  });

  it("embeds every chunk and promotes only after all upserts", async () => {
    const embeddings: string[] = [];
    const operations: string[] = [];
    const provider = { embed: async (text: string) => { embeddings.push(text); return [text.length]; } };
    const database = {
      begin: async (callback: (tx: {
        createVersion: (id: string, model: string) => Promise<void>;
        upsertChunk: (chunk: { text: string; sourceId: string; contentHash: string; embeddingModel: string; embedding: ReadonlyArray<number>; versionId: string; title: string; url: string; section?: string }) => Promise<void>;
        promoteVersion: (id: string) => Promise<void>;
      }) => Promise<void>) => callback({
        createVersion: async () => { operations.push("create"); },
        upsertChunk: async (chunk) => { operations.push(`upsert:${chunk.sourceId}:${chunk.contentHash}:${chunk.embedding.length}`); },
        promoteVersion: async () => { operations.push("promote"); },
      }),
    };
    const result = await indexKnowledge(provider, database as unknown as KnowledgeIndexDatabase);
    expect(result.documentCount).toBe(KNOWLEDGE_MANIFEST.length);
    expect(embeddings.length).toBe(result.chunkCount);
    expect(operations.at(-1)).toBe("promote");
    expect(operations.filter((operation) => operation === "create")).toHaveLength(1);
  });

  it("generates all embeddings before opening the database transaction", async () => {
    let transactionOpen = false;
    const provider = {
      embed: async () => {
        expect(transactionOpen).toBe(false);
        return [1];
      },
    };
    const database = {
      begin: async (callback: (tx: {
        createVersion: (id: string, model: string) => Promise<void>;
        upsertChunk: () => Promise<void>;
        promoteVersion: () => Promise<void>;
      }) => Promise<void>) => {
        transactionOpen = true;
        return callback({
          createVersion: async () => undefined,
          upsertChunk: async () => undefined,
          promoteVersion: async () => undefined,
        }).finally(() => { transactionOpen = false; });
      },
    };
    await indexKnowledge(provider, database as unknown as KnowledgeIndexDatabase);
  });

  it("does not promote when embedding fails", async () => {
    const operations: string[] = [];
    const provider = { embed: async () => { throw new Error("provider failed"); } };
    const database = {
      begin: async (callback: (tx: {
        createVersion: (id: string, model: string) => Promise<void>;
        upsertChunk: () => Promise<void>;
        promoteVersion: () => Promise<void>;
      }) => Promise<void>) => callback({
        createVersion: async () => { operations.push("create"); },
        upsertChunk: async () => { operations.push("upsert"); },
        promoteVersion: async () => { operations.push("promote"); },
      }),
    };
    await expect(indexKnowledge(provider, database as unknown as KnowledgeIndexDatabase)).rejects.toThrow("provider failed");
    expect(operations).not.toContain("promote");
  });

  it("upserts every mutable citation and embedding field when a chunk changes", async () => {
    const statements: string[] = [];
    const database = {
      begin: async (callback: (tx: {
        createVersion: (id: string, model: string) => Promise<void>;
        upsertChunk: (chunk: { text: string; sourceId: string; contentHash: string; embeddingModel: string; embedding: ReadonlyArray<number>; versionId: string; title: string; url: string; section?: string; sourcePath?: string; chunkOrdinal?: number; sourceOffset?: number }) => Promise<void>;
        promoteVersion: (id: string) => Promise<void>;
      }) => Promise<void>) => callback({
        createVersion: async () => undefined,
        upsertChunk: async (chunk) => {
          statements.push(JSON.stringify(chunk));
        },
        promoteVersion: async () => undefined,
      }),
    };
    await indexKnowledge(
      { embed: async () => [1, 2] },
      database as unknown as KnowledgeIndexDatabase,
    );
    const chunk = JSON.parse(statements[0] ?? "{}") as Record<string, unknown>;
    expect(chunk).toMatchObject({
      sourceId: expect.any(String),
      sourcePath: expect.any(String),
      contentHash: expect.any(String),
      embeddingModel: expect.any(String),
      chunkOrdinal: expect.any(Number),
      sourceOffset: expect.any(Number),
      title: expect.any(String),
      url: expect.any(String),
      section: expect.any(String),
    });
  });

  it("closes the database when provider setup fails", async () => {
    let closed = false;
    const database = {
      begin: async () => undefined,
      close: async () => {
        closed = true;
      },
    };

    await expect(
      runIndexCommand(
        () => {
          throw new Error("missing Gemini key");
        },
        () => database as unknown as KnowledgeIndexDatabase,
      ),
    ).rejects.toThrow("missing Gemini key");
    expect(closed).toBe(true);
  });
});
