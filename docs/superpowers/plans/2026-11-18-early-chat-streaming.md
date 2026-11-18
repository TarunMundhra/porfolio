# Early Chat Streaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start the recruiter-facing response immediately while RAG retrieval continues, then stream the grounded answer normally.

**Architecture:** Keep the existing NDJSON endpoint and browser reader. Move retrieval behind the stream boundary, add one transient `status` event, and leave provider streaming, validation, citations, and analytics intact.

**Tech Stack:** Next.js 15, React 18, TypeScript, Web Streams, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-11-18-early-chat-streaming-design.md`

## Global Constraints

- Add no dependency or new abstraction.
- Status copy is exactly `Finding relevant experience…`.
- Never persist or append status copy to the answer.
- Preserve existing validation, security, cancellation, output budgets, citations, and analytics.

## Review Focus

- Retrieval remains pending: the client receives `start` and `status` without waiting.
- Retrieval fails after streaming starts: the stream emits the existing safe error and releases the in-flight slot.
- Client cancels during retrieval: no provider call starts and capacity is released once.
- First token arrives: transient status is replaced, not concatenated.
- Empty retrieval result: the existing grounded insufficient-information response still completes.

---

### Task 1: Stream retrieval progress and grounded tokens

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/components/portfolio/PortfolioAssistant.tsx`
- Test: `tests/chat/route.test.ts`
- Test: `tests/ui/portfolio-assistant.spec.ts`

**Interfaces:**
- Consumes: existing `StreamEvent` NDJSON events and the `ChatDatabase.retrieveChunks` promise.
- Produces: `{ type: "status", message: "Finding relevant experience…" }` before retrieval and the unchanged token, citation, error, and done events afterward.

- [ ] **Step 1: Write the failing API test**

Add `returns start and retrieval status before retrieval completes`. Hold `state.retrieve` on a promise, call `POST`, read two chunks with a 100 ms guard, and assert they contain `start` and the exact `status` message before resolving retrieval.

- [ ] **Step 2: Run the API test and verify RED**

Run: `npm test -- tests/chat/route.test.ts -t "returns start and retrieval status before retrieval completes"`

Expected: FAIL because `POST` waits for retrieval.

- [ ] **Step 3: Write the failing UI test**

Add `shows retrieval status until the first answer token arrives`. Supply a controlled stream, emit the status event, assert the copy is visible, emit a token, and assert the copy is gone and the token is visible.

- [ ] **Step 4: Run the UI test and verify RED**

Run: `npm test -- tests/ui/portfolio-assistant.spec.ts -t "shows retrieval status until the first answer token arrives"`

Expected: FAIL because the client ignores status events.

- [ ] **Step 5: Implement the minimal server change**

In `POST`, create and return the response stream after portfolio assessment. On its first pull, enqueue the exact status event, perform embedding and retrieval once, build citations and the prompt, then continue the existing provider loop. Keep one release guard and abort-aware error handling.

- [ ] **Step 6: Implement the minimal client change**

Extend the local parsed event type with `message`. When a `status` event arrives before any token, render its message in the active assistant bubble; when the first token arrives, reset the display target before appending token content.

- [ ] **Step 7: Verify focused behavior**

Run: `npm test -- tests/chat/route.test.ts tests/ui/portfolio-assistant.spec.ts`

Expected: both files pass with no unhandled errors.

- [ ] **Step 8: Verify the repository**

Run: `npm test`, `npm run type-check`, and `npm run build`.

Expected: all commands exit 0.

- [ ] **Step 9: Run the frontend detector**

Run: `impeccable.cmd detect --json src/components/portfolio/PortfolioAssistant.tsx`.

Expected: no blocking findings introduced by the change.
