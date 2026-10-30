import { describe, expect, it, vi } from "vitest";

import type { Citation } from "@/lib/chat/contracts";
import { createChatStream } from "@/lib/chat/stream";

async function readEvents(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const events = [];
  let result = await reader.read();
  while (!result.done) {
    for (const line of decoder.decode(result.value).trim().split("\n")) {
      if (line) events.push(JSON.parse(line));
    }
    result = await reader.read();
  }
  return events;
}

const citation: Citation = { sourceId: "project-a", title: "Project A", url: "/projects#a" };

describe("chat stream", () => {
  it("emits start, tokens, unique citations, and one terminal done event", async () => {
    const events = await readEvents(
      createChatStream({
        requestId: "request-1",
        generate: (async function* () {
          yield "Hello";
          yield " world";
        })(),
        citations: [citation, citation],
      }),
    );

    expect(events).toEqual([
      { type: "start", requestId: "request-1" },
      { type: "token", value: "Hello" },
      { type: "token", value: " world" },
      { type: "citation", citation },
      { type: "done", requestId: "request-1" },
    ]);
    expect(events.filter((event) => ["done", "error"].includes(event.type))).toHaveLength(1);
  });

  it("maps failures to one generic terminal error", async () => {
    const events = await readEvents(
      createChatStream({
        requestId: "request-2",
        generate: (async function* () {
          yield "before";
          throw new Error("secret");
        })(),
      }),
    );

    expect(events.at(-1)).toEqual({
      type: "error",
      code: "internal",
      message: "Unable to complete response",
    });
    expect(JSON.stringify(events)).not.toContain("secret");
  });

  it("cancels provider iteration and releases the in-flight slot", async () => {
    const abort = vi.fn();
    const release = vi.fn();
    let returnCalled = false;
    const generate = {
      async next() {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return { done: false as const, value: "token" };
      },
      async return() {
        returnCalled = true;
        return { done: true as const, value: undefined };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };

    const stream = createChatStream({
      requestId: "request-3",
      generate,
      onCancel: abort,
      releaseSlot: release,
    });
    const reader = stream.getReader();
    await reader.read();
    await reader.cancel();

    expect(returnCalled).toBe(true);
    expect(abort).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
  });
});
