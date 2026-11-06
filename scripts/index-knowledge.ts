import { readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFParse } from "pdf-parse";
import { KNOWLEDGE_MANIFEST } from "../src/data/knowledge/manifest";
import { chunkDocument } from "../src/lib/chat/retrieval";
import type { KnowledgeDocument } from "../src/lib/chat/contracts";

export interface EmbeddingProvider {
  embed(text: string): Promise<ReadonlyArray<number>>;
}

export interface KnowledgeIndexDatabase {
  begin<T>(callback: (transaction: KnowledgeIndexTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface KnowledgeIndexTransaction {
  createVersion(versionId: string, embeddingModel: string): Promise<void>;
  upsertChunk(chunk: {
    sourceId: string;
    title: string;
    url: string;
    section?: string;
    text: string;
    contentHash: string;
    embeddingModel: string;
    embedding: ReadonlyArray<number>;
    versionId: string;
    chunkOrdinal: number;
    sourceOffset: number;
    sourcePath?: string;
  }): Promise<void>;
  promoteVersion(versionId: string): Promise<void>;
}

const root = resolve(process.cwd());
loadEnvConfig(root);
const embeddingModel = process.env.CHAT_EMBEDDING_MODEL ?? "gemini-embedding-001";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text.replace(/\s+/g, " ").trim();
    if (!text) throw new Error("resume PDF text extraction produced no text");
    return text;
  } finally {
    await parser.destroy();
  }
}

async function loadDocuments(): Promise<KnowledgeDocument[]> {
  const documents: KnowledgeDocument[] = [];
  for (const source of KNOWLEDGE_MANIFEST) {
    const path = resolve(root, source.sourcePath);
    const buffer = await readFile(path);
    const text = source.kind === "pdf" ? await extractPdfText(buffer) : buffer.toString("utf8");
    if (!text.trim()) throw new Error(`empty knowledge source: ${source.sourceId}`);
    documents.push({ ...source, text });
  }
  return documents;
}

function createGeminiProvider(): EmbeddingProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required");
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: embeddingModel });
  return {
    async embed(text) {
      const request = Object.assign(
        { content: { role: "user" as const, parts: [{ text }] } },
        { outputDimensionality: 768 },
      );
      const result = await model.embedContent(request);
      return result.embedding.values;
    },
  };
}

export function createDatabase(): KnowledgeIndexDatabase {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const sql = postgres(databaseUrl);
  return {
    async begin(callback) {
      return sql.begin(async (transaction) => {
        return callback({
          createVersion: async (versionId, model) => {
            await transaction`
              INSERT INTO chat_index_versions (id, embedding_model, status)
              VALUES (${versionId}, ${model}, 'building')
            `;
          },
          upsertChunk: async (chunk) => {
            await transaction`
              INSERT INTO chat_chunks
                (id, version_id, source_id, source_path, title, url, section, text, content_hash, embedding_model, embedding, chunk_ordinal, source_offset)
              VALUES
                (${`${chunk.versionId}:${chunk.sourceId}:${chunk.chunkOrdinal}:${chunk.sourceOffset}`}, ${chunk.versionId},
                 ${chunk.sourceId}, ${chunk.sourcePath ?? null}, ${chunk.title}, ${chunk.url}, ${chunk.section ?? null},
                 ${chunk.text}, ${chunk.contentHash}, ${chunk.embeddingModel},
                 ${JSON.stringify(chunk.embedding)}, ${chunk.chunkOrdinal}, ${chunk.sourceOffset})
              ON CONFLICT (id) DO UPDATE SET
                version_id = EXCLUDED.version_id, source_id = EXCLUDED.source_id,
                source_path = EXCLUDED.source_path, title = EXCLUDED.title,
                url = EXCLUDED.url, section = EXCLUDED.section, text = EXCLUDED.text,
                content_hash = EXCLUDED.content_hash, embedding_model = EXCLUDED.embedding_model,
                embedding = EXCLUDED.embedding, chunk_ordinal = EXCLUDED.chunk_ordinal,
                source_offset = EXCLUDED.source_offset
            `;
          },
          promoteVersion: async (versionId) => {
            try {
              await transaction`SELECT pg_advisory_xact_lock(hashtext('chat_index_promotion'))`;
              await transaction`UPDATE chat_index_versions SET status = 'retired' WHERE status = 'active'`;
              await transaction`UPDATE chat_index_versions SET status = 'active', activated_at = now() WHERE id = ${versionId}`;
            } catch {
              throw new Error("Knowledge index promotion failed");
            }
          },
        });
      });
    },
    async close() {
      await sql.end();
    },
  };
}

export async function indexKnowledge(
  provider = createGeminiProvider(),
  database = createDatabase(),
): Promise<{ versionId: string; documentCount: number; chunkCount: number }> {
  const documents = await loadDocuments();
  const versionId = randomUUID();
  const chunks = documents.flatMap((document) => chunkDocument(document));
  const embeddings = await Promise.all(chunks.map(async (chunk) => ({
    chunk,
    embedding: await provider.embed(chunk.text),
  })));
  await database.begin(async (transaction) => {
    await transaction.createVersion(versionId, embeddingModel);
    for (const { chunk, embedding } of embeddings) {
      await transaction.upsertChunk({
        ...chunk,
        contentHash: chunk.contentHash ?? createHash("sha256").update(chunk.text).digest("hex"),
        embeddingModel,
        embedding,
        versionId,
        chunkOrdinal: chunk.chunkOrdinal ?? 0,
        sourceOffset: chunk.sourceOffset ?? 0,
      });
    }
    await transaction.promoteVersion(versionId);
  });
  return { versionId, documentCount: documents.length, chunkCount: chunks.length };
}

export async function runIndexCommand(
  providerFactory: () => EmbeddingProvider = createGeminiProvider,
  databaseFactory: () => KnowledgeIndexDatabase = createDatabase,
): Promise<{ versionId: string; documentCount: number; chunkCount: number }> {
  let database: KnowledgeIndexDatabase | undefined;
  try {
    database = databaseFactory();
    return await indexKnowledge(providerFactory(), database);
  } finally {
    await database?.close();
  }
}

if (process.argv[1]?.endsWith("index-knowledge.ts")) {
  runIndexCommand()
    .then(({ versionId, documentCount, chunkCount }) => {
      console.log(`Knowledge index promoted: ${versionId}; sources=${documentCount}; chunks=${chunkCount}`);
    })
    .catch((error: unknown) => {
      console.error(`Knowledge index failed: ${error instanceof Error ? error.message : "unknown error"}`);
      process.exitCode = 1;
    });
}
