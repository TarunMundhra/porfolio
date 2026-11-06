import { beforeEach, describe, expect, it, vi } from "vitest";

const geminiEmbedContent = vi.fn();
const groqCreate = vi.fn();

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { embedContent: geminiEmbedContent };
    }
  },
}));

vi.mock("groq-sdk", () => ({
  default: class {
    chat = { completions: { create: groqCreate } };
  },
}));

import { createGeminiEmbedder } from "@/lib/chat/providers/gemini";
import { createGroqStreamer } from "@/lib/chat/providers/groq";

describe("provider adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("embeds every input and returns vectors without exposing provider errors", async () => {
    geminiEmbedContent
      .mockResolvedValueOnce({ embedding: { values: [1, 2] } })
      .mockResolvedValueOnce({ embedding: { values: [3, 4] } });

    const embed = createGeminiEmbedder({
      geminiApiKey: "secret-gemini",
      embeddingModel: "text-embedding-004",
    });

    await expect(embed.embed(["one", "two"])).resolves.toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(geminiEmbedContent).toHaveBeenNthCalledWith(1, {
      content: { role: "user", parts: [{ text: "one" }] },
      outputDimensionality: 768,
    });
  });

  it("maps embedding failures to a typed generic error", async () => {
    geminiEmbedContent.mockRejectedValue(new Error("secret provider response"));
    const embed = createGeminiEmbedder({
      geminiApiKey: "secret-gemini",
      embeddingModel: "text-embedding-004",
    });

    await expect(embed.embed(["one"])).rejects.toMatchObject({
      code: "unavailable",
      message: "Embedding provider unavailable",
    });
    await expect(embed.embed(["one"])).rejects.not.toThrow("secret provider");
  });

  it("streams Qwen deltas with the abort signal and output cap", async () => {
    const signal = new AbortController().signal;
    groqCreate.mockResolvedValue(
      (async function* () {
        yield { choices: [{ delta: { content: "Hello" } }] };
        yield { choices: [{ delta: { content: " world" } }] };
      })(),
    );

    const stream = createGroqStreamer({
      groqApiKey: "secret-groq",
      model: "qwen-2.5-32b",
      maxOutputTokens: 42,
      timeoutMs: 1000,
    });

    await expect(Array.fromAsync(stream.generate("question", signal))).resolves.toEqual([
      "Hello",
      " world",
    ]);
    expect(groqCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "qwen-2.5-32b",
        max_tokens: 42,
        stream: true,
      }),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(groqCreate.mock.calls[0][1]?.signal).not.toBe(signal);
  });

  it("maps generation failures without returning provider details", async () => {
    groqCreate.mockRejectedValue(new Error("secret groq response"));
    const stream = createGroqStreamer({
      groqApiKey: "secret-groq",
      model: "qwen-2.5-32b",
      maxOutputTokens: 42,
      timeoutMs: 1000,
    });

    await expect(Array.fromAsync(stream.generate("question", new AbortController().signal)))
      .rejects.toMatchObject({ code: "unavailable", message: "Generation provider unavailable" });
  });

  it("aborts a never-resolving request when the timeout expires", async () => {
    let requestSignal: AbortSignal | undefined;
    groqCreate.mockImplementation((_request: unknown, options?: { signal?: AbortSignal }) => {
      requestSignal = options?.signal;
      return new Promise(() => undefined);
    });

    const stream = createGroqStreamer({
      groqApiKey: "secret-groq",
      model: "qwen-2.5-32b",
      maxOutputTokens: 42,
      timeoutMs: 10,
    });

    await expect(
      Array.fromAsync(stream.generate("question", new AbortController().signal)),
    ).rejects.toMatchObject({
      code: "unavailable",
      message: "Generation provider unavailable",
    });
    expect(requestSignal).toBeDefined();
    expect(requestSignal?.aborted).toBe(true);
  });

  it("times out a pending stream next call and maps it to unavailable", async () => {
    groqCreate.mockResolvedValue({
      next: () => new Promise<IteratorResult<unknown>>(() => undefined),
      return: vi.fn().mockResolvedValue({ done: true, value: undefined }),
      [Symbol.asyncIterator]() {
        return this;
      },
    });

    const stream = createGroqStreamer({
      groqApiKey: "secret-groq",
      model: "qwen-2.5-32b",
      maxOutputTokens: 42,
      timeoutMs: 10,
    });

    await expect(
      Array.fromAsync(stream.generate("question", new AbortController().signal)),
    ).rejects.toMatchObject({
      code: "unavailable",
      message: "Generation provider unavailable",
    });
    expect(groqCreate.mock.results[0].value).toBeDefined();
  });
});
