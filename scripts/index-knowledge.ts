import { readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import postgres from "postgres";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { KNOWLEDGE_MANIFEST } from "../src/data/knowledge/manifest";
import { chunkDocument } from "../src/lib/chat/retrieval";
import type { KnowledgeDocument } from "../src/lib/chat/contracts";

export interface EmbeddingProvider {
  embed(text: string): Promise<ReadonlyArray<number>>;
}

export interface KnowledgeIndexDatabase {
  begin<T>(callback: (transaction: KnowledgeIndexTransaction) => Promise<T>): Promise<T>;
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
  }): Promise<void>;
  promoteVersion(versionId: string): Promise<void>;
}

const root = resolve(process.cwd());
const embeddingModel = process.env.CHAT_EMBEDDING_MODEL ?? "text-embedding-004";

function extractPdfText(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const matches = [...raw.matchAll(/\(([^()]*)\)\s*T[jJ]/g)].map((match) =>
    match[1].replace(/\\([()\\])/g, "$1"),
  );
  const text = matches.join(" ").replace(/\s+/g, " ").trim();
  if (!text) throw new Error("resume PDF text extraction produced no text");
  return text;
}

async function loadDocuments(): Promise<KnowledgeDocument[]> {
  const documents: KnowledgeDocument[] = [];
  for (const source of KNOWLEDGE_MANIFEST) {
    const path = resolve(root, source.sourcePath);
    const buffer = await readFile(path);
    const text = source.kind === "pdf" ? extractPdfText(buffer) : buffer.toString("utf8");
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
      const result = await model.embedContent(text);
      return result.embedding.values;
    },
  };
}

function createDatabase(): KnowledgeIndexDatabase {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const sql = postgres(databaseUrl);
  return {
    async begin(callback) {
      return sql.begin(async (transaction) => {
        return callback({
          createVersion: async (versionId, model) => {
            await transaction`
              INSERT INTO knowledge_index_versions (id, embedding_model, active)
              VALUES (${versionId}, ${model}, false)
            `;
          },
          upsertChunk: async (chunk) => {
            await transaction`
              INSERT INTO knowledge_chunks
                (source_id, title, url, section, content, content_hash, embedding_model, embedding, index_version)
              VALUES
                (${chunk.sourceId}, ${chunk.title}, ${chunk.url}, ${chunk.section ?? null},
                 ${chunk.text}, ${chunk.contentHash}, ${chunk.embeddingModel},
                 ${JSON.stringify(chunk.embedding)}, ${chunk.versionId})
              ON CONFLICT (source_id, content_hash, embedding_model)
              DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url, section = EXCLUDED.section,
                content = EXCLUDED.content, embedding = EXCLUDED.embedding, index_version = EXCLUDED.index_version
            `;
          },
          promoteVersion: async (versionId) => {
            await transaction`UPDATE knowledge_index_versions SET active = false WHERE active = true`;
            await transaction`UPDATE knowledge_index_versions SET active = true WHERE id = ${versionId}`;
          },
        });
      });
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
  await database.begin(async (transaction) => {
    await transaction.createVersion(versionId, embeddingModel);
    for (const chunk of chunks) {
      await transaction.upsertChunk({
        ...chunk,
        contentHash: chunk.contentHash ?? createHash("sha256").update(chunk.text).digest("hex"),
        embeddingModel,
        embedding: await provider.embed(chunk.text),
        versionId,
      });
    }
    await transaction.promoteVersion(versionId);
  });
  return { versionId, documentCount: documents.length, chunkCount: chunks.length };
}

if (process.argv[1]?.endsWith("index-knowledge.ts")) {
  indexKnowledge()
    .then(({ versionId, documentCount, chunkCount }) => {
      console.log(`Knowledge index promoted: ${versionId}; sources=${documentCount}; chunks=${chunkCount}`);
    })
    .catch((error: unknown) => {
      console.error(`Knowledge index failed: ${error instanceof Error ? error.message : "unknown error"}`);
      process.exitCode = 1;
    });
}
