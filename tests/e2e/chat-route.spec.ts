import { expect, test, type APIResponse } from "@playwright/test";

async function readEvents(response: APIResponse) {
  const lines = (await response.body()).toString("utf8").trim().split("\n");
  return lines.map((line) => JSON.parse(line) as Record<string, unknown>);
}

const headers = {
  "content-type": "application/json",
  origin: "http://127.0.0.1:3000",
};

test.describe("chat API streaming smoke", () => {
  test("runs the route lifecycle with deterministic test providers", async ({ request }) => {
    const response = await request.post("/api/chat", {
      headers,
      data: { question: "What projects has Tarun built?" },
    });
    expect(response.status()).toBe(200);
    const events = await readEvents(response);
    expect(events.map((event) => event.type)).toEqual(["start", "token", "citation", "done"]);
    expect(events.find((event) => event.type === "token")?.value).toContain("[1]");
  });

  test("returns generic provider errors without leakage", async ({ request }) => {
    const response = await request.post("/api/chat", {
      headers,
      data: { question: "Tell me about portfolio provider error handling." },
    });
    const events = await readEvents(response);
    expect(events.at(-1)).toMatchObject({ type: "error", code: "unavailable", message: "Provider unavailable" });
    expect(JSON.stringify(events)).not.toContain("test provider failure");
  });

  test("validates origin and content type with security headers", async ({ request }) => {
    const invalid = await request.post("/api/chat", {
      headers: { "content-type": "text/plain", origin: "http://127.0.0.1:3000" },
      data: "{}",
    });
    expect(invalid.status()).toBe(415);
    expect(invalid.headers()["x-content-type-options"]).toBe("nosniff");
    const forbidden = await request.post("/api/chat", {
      headers: { ...headers, origin: "http://attacker.test" },
      data: { question: "What projects has Tarun built?" },
    });
    expect(forbidden.status()).toBe(403);
  });

  test("cancels a route stream through the browser request API", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const controller = new AbortController();
      const pending = fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json", origin: location.origin },
        body: JSON.stringify({ question: "Tell me about portfolio cancel stream handling." }),
        signal: controller.signal,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
      controller.abort();
      try {
        await pending;
        return "completed";
      } catch {
        return "aborted";
      }
    });
    expect(result).toBe("aborted");
  });
});
