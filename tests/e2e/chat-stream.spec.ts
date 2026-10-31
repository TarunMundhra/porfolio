import { expect, test } from "@playwright/test";

import { createChatStream } from "../../src/lib/chat/stream";

async function eventsFrom(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const events: Array<Record<string, unknown>> = [];
  for (;;) {
    const result = await reader.read();
    if (result.done) return events;
    for (const line of decoder.decode(result.value).split("\n").filter(Boolean)) events.push(JSON.parse(line));
  }
}

test.describe("chat stream smoke", () => {
  test("emits start, token, citation, and done", async () => {
    const events = await eventsFrom(createChatStream({
      requestId: "smoke",
      generate: (async function* () { yield "grounded answer"; })(),
      citations: [{ sourceId: "project", title: "Project", url: "/projects" }],
    }));
    expect(events.map((event) => event.type)).toEqual(["start", "token", "citation", "done"]);
  });

  test("cancels generation and releases capacity", async () => {
    let returned = false;
    const release = { count: 0 };
    const generate = {
      async next() { return { done: false as const, value: "partial" }; },
      async return() { returned = true; return { done: true as const, value: undefined }; },
      [Symbol.asyncIterator]() { return this; },
    };
    const reader = createChatStream({ requestId: "cancel", generate, releaseSlot: () => { release.count += 1; } }).getReader();
    await reader.read();
    await reader.cancel();
    expect(returned).toBe(true);
    expect(release.count).toBe(1);
  });

  test("converts provider errors to one generic terminal event", async () => {
    const events = await eventsFrom(createChatStream({
      requestId: "error",
      generate: (async function* () { throw new Error("provider secret"); })(),
    }));
    expect(events.at(-1)).toEqual({ type: "error", code: "internal", message: "Unable to complete response" });
    expect(JSON.stringify(events)).not.toContain("provider secret");
  });
});
