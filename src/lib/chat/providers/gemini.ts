import { GoogleGenerativeAI } from "@google/generative-ai";

import type { ChatConfig } from "@/lib/chat/config";

export type ProviderErrorCode = "unavailable" | "internal";

export class ChatProviderError extends Error {
  readonly code: ProviderErrorCode;

  constructor(code: ProviderErrorCode, message: string) {
    super(message);
    this.name = "ChatProviderError";
    this.code = code;
  }
}

export interface GeminiEmbedder {
  embed(texts: string[]): Promise<number[][]>;
}

interface GeminiEmbeddingClient {
  embedContent(text: string): Promise<{ embedding?: { values?: number[] } }>;
}

export function createGeminiEmbedder(
  config: Pick<ChatConfig, "geminiApiKey" | "embeddingModel">,
  client?: GeminiEmbeddingClient,
): GeminiEmbedder {
  const model =
    client ??
    new GoogleGenerativeAI(config.geminiApiKey).getGenerativeModel({
      model: config.embeddingModel,
    });

  return {
    async embed(texts) {
      try {
        const results = await Promise.all(texts.map((text) => model.embedContent(text)));
        const vectors = results.map((result) => result.embedding?.values);
        if (vectors.some((values) => !values)) {
          throw new Error("Missing embedding");
        }
        return vectors as number[][];
      } catch {
        throw new ChatProviderError("unavailable", "Embedding provider unavailable");
      }
    },
  };
}
