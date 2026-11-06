# Chat Timing Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add privacy-safe client and server timing logs for prompt-to-answer latency.

**Architecture:** Reuse the existing client streaming loop and server `correlationId`. The browser logs prompt submission, first response byte, first token, and completion using `performance.now()`. The API logs retrieval completion, first token, and completion with only correlation ID, stage, and elapsed milliseconds.

**Tech Stack:** Next.js 15, React, TypeScript, Vitest, browser `performance.now()`.

---

### Task 1: Add server timing logs

**Files:**
- Modify: `src/app/api/chat/route.ts:250-500`
- Test: `tests/chat/route.test.ts`

- [ ] **Step 1: Add a timing helper and request start timestamp**

Add near `logFailure`:

```ts
function logTiming(correlationId: string, stage: string, startedAt: number): void {
  try {
    console.info(JSON.stringify({
      correlationId,
      stage,
      elapsedMs: Math.round(performance.now() - startedAt),
    }));
  } catch {
    // Timing logs must never affect the response.
  }
}
```

At the start of `POST`, after creating `correlationId`, add:

```ts
const startedAt = performance.now();
```

- [ ] **Step 2: Log retrieval completion**

Immediately after the `retrieveChunks` call succeeds, add:

```ts
logTiming(correlationId, "retrieval_completed", startedAt);
```

- [ ] **Step 3: Log first generated token and completion**

In the streaming `pull`, immediately before enqueueing the first non-empty
provider token, add:

```ts
if (assembled.length === 0) {
  logTiming(correlationId, "first_token", startedAt);
}
```

Immediately before the successful `recordOutcome` call after the `done` event,
add:

```ts
logTiming(correlationId, "completed", startedAt);
```

Also log `completed` in the no-chunks fallback immediately before returning,
so every successful response has a terminal timing record.

- [ ] **Step 4: Add a route test for timing log shape**

In `tests/chat/route.test.ts`, spy on `console.info` for a successful response,
consume the full stream, and assert each timing entry contains only the allowed
fields:

```ts
const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
try {
  await events(await POST(request({ question: "Tell me about the projects." })));
  const timingEntries = info.mock.calls
    .map(([value]) => JSON.parse(String(value)) as Record<string, unknown>)
    .filter((entry) => typeof entry.stage === "string");

  expect(timingEntries.length).toBeGreaterThan(0);
  for (const entry of timingEntries) {
    expect(Object.keys(entry).sort()).toEqual(["correlationId", "elapsedMs", "stage"]);
    expect(typeof entry.correlationId).toBe("string");
    expect(typeof entry.elapsedMs).toBe("number");
  }
} finally {
  info.mockRestore();
}
```

- [ ] **Step 5: Run the focused route tests**

Run:

```powershell
npm test -- tests/chat/route.test.ts
```

Expected: all route tests pass.

- [ ] **Step 6: Commit the server logging change**

```powershell
git add src/app/api/chat/route.ts tests/chat/route.test.ts
git commit -m "feat: log chat server timing"
```

### Task 2: Add client timing logs

**Files:**
- Modify: `src/components/portfolio/PortfolioAssistant.tsx:95-190`

- [ ] **Step 1: Record prompt submission time**

At the beginning of `send`, after validating `trimmed`, add:

```ts
const startedAt = performance.now();
let firstResponseByteAt: number | undefined;
let firstTokenAt: number | undefined;
```

Immediately after `fetch` resolves, add:

```ts
firstResponseByteAt = performance.now();
console.info("[chat] first_response_byte", {
  elapsedMs: Math.round(firstResponseByteAt - startedAt),
});
```

Immediately before the fetch, add:

```ts
console.info("[chat] prompt_sent");
```

- [ ] **Step 2: Log first token and completed timings**

In the `event.type === "token"` branch, before `setMessages`, add:

```ts
if (firstTokenAt === undefined) {
  firstTokenAt = performance.now();
  console.info("[chat] first_token", {
    elapsedMs: Math.round(firstTokenAt - startedAt),
  });
}
```

In the `event.type === "done"` branch, add:

```ts
console.info("[chat] completed", {
  elapsedMs: Math.round(performance.now() - startedAt),
  timeToFirstResponseByteMs: firstResponseByteAt
    ? Math.round(firstResponseByteAt - startedAt)
    : null,
  timeToFirstTokenMs: firstTokenAt
    ? Math.round(firstTokenAt - startedAt)
    : null,
});
```

- [ ] **Step 3: Run type-checking**

Run:

```powershell
npm run type-check
```

Expected: TypeScript exits successfully.

- [ ] **Step 4: Manually verify browser logs**

Run:

```powershell
npm run dev
```

Open `http://localhost:3000`, open DevTools Console, submit a chat prompt, and
confirm logs appear for `prompt_sent`, `first_response_byte`, `first_token`, and
`completed`. Confirm no prompt or answer text appears in timing log payloads.

- [ ] **Step 5: Commit the client logging change**

```powershell
git add src/components/portfolio/PortfolioAssistant.tsx
git commit -m "feat: log chat client timing"
```

### Task 3: Final verification

**Files:**
- Verify: `src/app/api/chat/route.ts`
- Verify: `src/components/portfolio/PortfolioAssistant.tsx`
- Verify: `tests/chat/route.test.ts`

- [ ] **Step 1: Run focused tests and type-check together**

Run:

```powershell
npm test -- tests/chat/route.test.ts; if ($?) { npm run type-check }
```

Expected: both commands exit successfully.

- [ ] **Step 2: Review the final diff for privacy**

Run:

```powershell
git diff HEAD~2..HEAD -- src/app/api/chat/route.ts src/components/portfolio/PortfolioAssistant.tsx
```

Confirm timing logs contain only event names, correlation IDs where available,
and elapsed durations; do not log prompt, answer, token contents, citations, or
environment secrets.
