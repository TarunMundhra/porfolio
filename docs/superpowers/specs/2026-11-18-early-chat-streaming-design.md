# Early Chat Streaming Design

## Intent

Give recruiters immediate, meaningful feedback after they submit a question while preserving grounded RAG answers and real token streaming. The current API waits for embedding and vector retrieval before returning its `ReadableStream`, so the browser receives no bytes during the longest pre-generation stage.

## Goals

- Return the chat response stream before embedding and database retrieval complete.
- Emit an honest retrieval status that the assistant displays immediately.
- Continue emitting Groq tokens, citations, and the terminal event through the existing NDJSON protocol.
- Preserve request validation, rate limiting, cancellation, analytics, output limits, and answer validation.

## Non Goals

- Do not skip, cache, or weaken retrieval.
- Do not stream database rows or expose internal timing details to users.
- Do not add dependencies or redesign the chat drawer.

## Approach

Move embedding and vector retrieval into the response stream lifecycle. The stream emits `start` and a `status` event as soon as it is consumed, performs retrieval once, and then advances the existing provider iterator one delta per pull. The frontend treats `status` as temporary copy only while no answer token has arrived; the first token replaces it.

Alternatives considered were a frontend-only loading label, which leaves the response itself blocked, and skipping or caching retrieval, which risks stale or ungrounded answers. Early response streaming fixes the actual boundary without changing answer quality.

## Constraints

- Status copy is `Finding relevant experience…`.
- Status is not appended to the final answer or persisted as assistant content.
- Retrieval failures retain the existing public error shape and release capacity once.
- Existing NDJSON parsing and security headers remain unchanged.

## Validation

- A route regression test must observe `start` and `status` before a deliberately unresolved retrieval promise settles.
- A UI regression test must show the status, then replace it with the first answer token.
- Focused tests, the full test suite, type checking, production build, and the Impeccable detector must pass before completion.
