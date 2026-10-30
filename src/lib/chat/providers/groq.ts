import Groq from "groq-sdk";

import type { ChatConfig } from "@/lib/chat/config";
import { ChatProviderError } from "./gemini";

interface GroqDelta {
  choices?: Array<{ delta?: { content?: string | null } }>;
}

interface GroqClient {
  chat: {
    completions: {
      create(options: Record<string, unknown>): Promise<AsyncIterable<GroqDelta>>;
    };
  };
}

export interface GroqStreamer {
  generate(prompt: string, signal: AbortSignal): AsyncIterable<string>;
}

export interface GroqStreamerOptions
  extends Pick<ChatConfig, "groqApiKey" | "model" | "maxOutputTokens"> {
  timeoutMs: number;
}

export function createGroqStreamer(
  options: GroqStreamerOptions,
  client?: GroqClient,
): GroqStreamer {
  const groq =
    client ??
    new Groq({
      apiKey: options.groqApiKey,
    });

  return {
    async *generate(prompt, signal) {
      const timeoutController = new AbortController();
      const abort = () => timeoutController.abort(signal.reason);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
      const timeout = setTimeout(() => timeoutController.abort(), options.timeoutMs);

      try {
        if (signal.aborted) {
          throw new ChatProviderError("unavailable", "Generation provider unavailable");
        }
        const response = await Promise.race([
          groq.chat.completions.create({
          model: options.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: options.maxOutputTokens,
          stream: true,
          signal,
          }),
          new Promise<never>((_, reject) => {
            timeoutController.signal.addEventListener(
              "abort",
              () => reject(new ChatProviderError("unavailable", "Generation provider unavailable")),
              { once: true },
            );
          }),
        ]);
        for await (const chunk of response) {
          if (timeoutController.signal.aborted) {
            throw new ChatProviderError("unavailable", "Generation provider unavailable");
          }
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) yield content;
        }
      } catch (error) {
        if (error instanceof ChatProviderError) throw error;
        throw new ChatProviderError("unavailable", "Generation provider unavailable");
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
      }
    },
  };
}
