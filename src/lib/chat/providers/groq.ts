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
      let abortListener: (() => void) | undefined;

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
          signal: timeoutController.signal,
          }),
          new Promise<never>((_, reject) => {
            timeoutController.signal.addEventListener(
              "abort",
              () => reject(new ChatProviderError("unavailable", "Generation provider unavailable")),
              { once: true },
            );
          }),
        ]);
        const iterator = response[Symbol.asyncIterator]();
        const abortPromise = new Promise<never>((_, reject) => {
          abortListener = () =>
            reject(new ChatProviderError("unavailable", "Generation provider unavailable"));
          if (timeoutController.signal.aborted) abortListener();
          else timeoutController.signal.addEventListener("abort", abortListener, { once: true });
        });
        try {
          while (true) {
            const next = await Promise.race([iterator.next(), abortPromise]);
            if (next.done) break;
            const content = next.value.choices?.[0]?.delta?.content;
            if (content) yield content;
          }
        } finally {
          if (timeoutController.signal.aborted) {
            void Promise.resolve()
              .then(() => iterator.return?.())
              .catch(() => undefined);
          }
        }
      } catch (error) {
        if (error instanceof ChatProviderError) throw error;
        throw new ChatProviderError("unavailable", "Generation provider unavailable");
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
        if (abortListener) timeoutController.signal.removeEventListener("abort", abortListener);
      }
    },
  };
}
