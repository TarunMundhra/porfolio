import type { RetrievedChunk } from "./contracts";
import { randomUUID } from "node:crypto";

type Query = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<ReadonlyArray<Record<string, unknown>>>;

export interface RedactedMessageRecord {
  role: "user" | "assistant" | "system";
  content: string;
  refused?: boolean;
  error?: boolean;
  inputTokens?: number;
  outputTokens?: number;
}

export interface RedactedConversationRecord {
  conversationId: string;
  ownerId: string;
  createdAt: string;
  messages: ReadonlyArray<RedactedMessageRecord>;
  expiresAt: string;
}

export interface ChatDatabase {
  retrieveChunks(embedding: ReadonlyArray<number>, options: { limit: number; minimumSimilarity: number }): Promise<RetrievedChunk[]>;
  persistConversation(record: RedactedConversationRecord): Promise<void>;
  getConversation(conversationId: string): Promise<RedactedConversationRecord | undefined>;
  deleteConversation(conversationId: string): Promise<void>;
  purgeExpired(now?: Date): Promise<void>;
  close?(): Promise<void>;
}

export interface ChatDatabaseOptions {
  logError?: (fields: { correlationId: string }) => void;
}

function databaseError(options: ChatDatabaseOptions): Error {
  const correlationId = randomUUID();
  options.logError?.({ correlationId });
  return new Error("Chat database unavailable");
}

function mapChunk(row: Record<string, unknown>): RetrievedChunk {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    title: String(row.title),
    url: String(row.url),
    section: row.section == null ? undefined : String(row.section),
    text: String(row.text),
    similarity: Number(row.similarity),
    contentHash: row.content_hash == null ? undefined : String(row.content_hash),
    embeddingModel: row.embedding_model == null ? undefined : String(row.embedding_model),
    sourcePath: row.source_path == null ? undefined : String(row.source_path),
    chunkOrdinal: row.chunk_ordinal == null ? undefined : Number(row.chunk_ordinal),
    sourceOffset: row.source_offset == null ? undefined : Number(row.source_offset),
  };
}

export function createChatDatabase(sql: Query, dbOptions: ChatDatabaseOptions = {}): ChatDatabase {
  return {
    async retrieveChunks(embedding, options) {
      try {
        const vector = `[${embedding.join(",")}]`;
        const rows = await sql`
          SELECT c.id, c.source_id, c.title, c.url, c.section, c.text, c.content_hash,
                 c.embedding_model, c.source_path, c.chunk_ordinal, c.source_offset,
                 1 - (c.embedding <=> ${vector}::vector) AS similarity
          FROM chat_chunks c
          INNER JOIN chat_index_versions v ON v.id = c.version_id
          WHERE v.status = 'active'
            AND 1 - (c.embedding <=> ${vector}::vector) >= ${options.minimumSimilarity}
          ORDER BY c.embedding <=> ${vector}::vector
          LIMIT ${options.limit}
        `;
        return rows.map(mapChunk);
      } catch {
        throw databaseError(dbOptions);
      }
    },
    async persistConversation(record) {
      try {
        await sql`
          INSERT INTO chat_conversations (id, owner_id, created_at, expires_at)
          VALUES (${record.conversationId}, ${record.ownerId}, ${record.createdAt}, ${record.expiresAt})
          ON CONFLICT (id) DO UPDATE SET owner_id = EXCLUDED.owner_id, expires_at = EXCLUDED.expires_at
        `;
        for (const [index, message] of record.messages.entries()) {
          await sql`
            INSERT INTO chat_messages (conversation_id, ordinal, role, content, refused, error, input_tokens, output_tokens)
            VALUES (${record.conversationId}, ${index}, ${message.role}, ${message.content},
                    ${message.refused ?? false}, ${message.error ?? false},
                    ${message.inputTokens ?? null}, ${message.outputTokens ?? null})
          `;
        }
      } catch {
        throw databaseError(dbOptions);
      }
    },
    async getConversation(conversationId) {
      try {
        const rows = await sql`
          SELECT c.id, c.owner_id, c.created_at, c.expires_at,
                 COALESCE(json_agg(json_build_object(
                   'role', m.role, 'content', m.content, 'refused', m.refused, 'error', m.error,
                   'inputTokens', m.input_tokens, 'outputTokens', m.output_tokens
                 ) ORDER BY m.ordinal) FILTER (WHERE m.id IS NOT NULL), '[]') AS messages
          FROM chat_conversations c
          LEFT JOIN chat_messages m ON m.conversation_id = c.id
          WHERE c.id = ${conversationId}
          GROUP BY c.id
        `;
        const row = rows[0];
        if (!row) return undefined;
        return {
          conversationId: String(row.id),
          ownerId: String(row.owner_id),
          createdAt: new Date(String(row.created_at)).toISOString(),
          expiresAt: new Date(String(row.expires_at)).toISOString(),
          messages: (row.messages as RedactedMessageRecord[]) ?? [],
        };
      } catch {
        throw databaseError(dbOptions);
      }
    },
    async deleteConversation(conversationId) {
      try {
        await sql`DELETE FROM chat_conversations WHERE id = ${conversationId}`;
      } catch {
        throw databaseError(dbOptions);
      }
    },
    async purgeExpired(now = new Date()) {
      try {
        await sql`DELETE FROM chat_conversations WHERE expires_at <= ${now.toISOString()}`;
      } catch {
        throw databaseError(dbOptions);
      }
    },
  };
}
