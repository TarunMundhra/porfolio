import { randomUUID } from "node:crypto";
import { redactForAnalytics } from "./security";
import type { ChatDatabase, RedactedMessageRecord } from "./db";

export interface RedactedConversationRecord {
  conversationId: string;
  ownerId: string;
  createdAt: string;
  messages: ReadonlyArray<RedactedMessageRecord>;
  expiresAt: string;
  event?: {
    correlationId: string;
    providerStatus?: string;
    errorCode?: string;
    latencyMs?: number;
  };
}

export function createRedactedConversationRecord(input: {
  conversationId: string;
  ownerId: string;
  messages: ReadonlyArray<Omit<RedactedMessageRecord, "content"> & { content: string }>;
  now?: Date;
  retentionDays?: number;
  event?: RedactedConversationRecord["event"];
}): RedactedConversationRecord {
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + (input.retentionDays ?? 30) * 86_400_000);
  return {
    conversationId: input.conversationId,
    ownerId: input.ownerId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    messages: input.messages.map((message) => ({ ...message, content: redactForAnalytics(message.content) })),
    event: input.event,
  };
}

export class AnalyticsAuthorizationError extends Error {
  readonly code = "forbidden" as const;
}

export interface AnalyticsOptions {
  database: Pick<ChatDatabase, "persistConversation"> &
    Partial<Pick<ChatDatabase, "getConversation" | "deleteConversation">>;
  recordMetric?: (name: string, fields: { correlationId: string }) => void;
  logError?: (fields: { correlationId: string }) => void;
}

export function createAnalytics(options: AnalyticsOptions) {
  return {
    async recordConversation(record: RedactedConversationRecord): Promise<void> {
      const correlationId = randomUUID();
      try {
        await options.database.persistConversation(record);
      } catch {
        try {
          options.recordMetric?.("chat.analytics.persistence_failed", { correlationId });
        } catch {
          // Analytics observability is best-effort.
        }
        try {
          options.logError?.({ correlationId });
        } catch {
          // Analytics observability is best-effort.
        }
      }
    },
    async readConversation(conversationId: string, ownerId: string): Promise<RedactedConversationRecord | undefined> {
      if (!options.database.getConversation) throw new Error("Analytics reads are unavailable");
      const record = await options.database.getConversation(conversationId);
      if (record && record.ownerId !== ownerId) throw new AnalyticsAuthorizationError("Forbidden");
      return record as RedactedConversationRecord | undefined;
    },
    async deleteConversation(conversationId: string, ownerId: string): Promise<void> {
      if (!options.database.getConversation || !options.database.deleteConversation) {
        throw new Error("Analytics deletes are unavailable");
      }
      const record = await options.database.getConversation(conversationId);
      if (record && record.ownerId !== ownerId) throw new AnalyticsAuthorizationError("Forbidden");
      await options.database.deleteConversation(conversationId);
    },
  };
}
