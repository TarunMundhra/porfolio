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
  embedContent(request: {
    content: { role: "user"; parts: Array<{ text: string }> };
    outputDimensionality: number;
  }): Promise<{ embedding?: { values?: number[] } }>;
}

export function createGeminiEmbedder(
  config: Pick<ChatConfig, "geminiApiKey" | "embeddingModel">,
  client?: GeminiEmbeddingClient,
): GeminiEmbedder {
  const model = client ?? (() => {
    const sdkModel = new GoogleGenerativeAI(config.geminiApiKey).getGenerativeModel({
      model: config.embeddingModel,
    });
    return {
      embedContent(request: {
        content: { role: "user"; parts: Array<{ text: string }> };
        outputDimensionality: number;
      }) {
        return sdkModel.embedContent(request);
      },
    };
  })();

  return {
    async embed(texts) {
      try {
        const results = await Promise.all(
          texts.map((text) =>
            model.embedContent({
              content: { role: "user", parts: [{ text }] },
              outputDimensionality: 768,
            }),
          ),
        );
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
