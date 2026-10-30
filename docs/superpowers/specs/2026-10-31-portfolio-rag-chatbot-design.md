# Portfolio RAG Chatbot Design

## Status

Approved design for implementation planning.

## Context

The portfolio is a Next.js 15 App Router application with a teal/green glassmorphism
interface. It currently uses `output: "export"` and has no server layer. The deployed
feature must answer portfolio questions from grounded portfolio and resume content,
stream responses, resist prompt injection, protect provider credentials, and support
owner-only conversation analytics.

## Decision

Use a Vercel-native Next.js deployment with a server-side chat route and a managed
vector-capable database. Remove static export mode; pages remain statically optimized
where possible, while the chat route executes on Vercel.

- Gemini provides embeddings and may provide an optional safety classification.
- Groq Qwen provides low-latency streamed generation.
- Provider keys are server-only environment variables.
- A managed Postgres/vector service stores versioned chunks, embeddings, and protected
  analytics records.
- The initial knowledge scope is curated portfolio content plus
  `public/Tarun-Mundhra-Resume.pdf`.
- The supplied AI-agent transcript is excluded from v1 unless its claims are manually
  approved and added to the curated corpus.

## Alternatives considered

### Static build-time retrieval

This would keep the deployment simple by shipping a small retrieval JSON file with
the static site. It is appropriate for a prototype, but has weaker semantic search,
less flexible corpus updates, and limited analytics support.

### Separate backend

A standalone FastAPI or Node service would isolate the API and provide maximum runtime
control. It also introduces another deployment, CORS boundary, monitoring surface, and
operational cost for a feature that fits the existing Next.js application.

The Vercel-native approach is preferred because it preserves one deployment boundary,
supports streaming route handlers, and keeps secrets and retrieval server-side.

## Architecture and data flow

### Indexing

1. Select only approved public portfolio and resume sources.
2. Exclude `.env` files, credentials, private files, generated output, dependencies,
   and unapproved transcript material.
3. Extract text, normalize whitespace, and chunk by semantic section with overlap.
4. Assign stable source IDs, document versions, titles, URLs/anchors, and content
   hashes.
5. Generate embeddings with Gemini in an explicit indexing job.
6. Store chunks, embeddings, metadata, and index version in the managed database.
7. Make indexing idempotent and allow a new version to be promoted atomically.

### Chat request

1. The client sends a bounded JSON request to `POST /api/chat`.
2. The route checks the request schema, origin, content length, rate limit, and
   concurrency budget.
3. The question is normalized and embedded server-side.
4. The route retrieves the top relevant chunks and applies a similarity threshold.
5. The route constructs a prompt where user input and retrieved text are explicitly
   delimited untrusted data.
6. The route calls Groq Qwen with streaming enabled and propagates client
   cancellation/timeouts.
7. The route emits typed stream events:
   `start`, `token`, `citation`, `done`, and `error`.
8. The route performs bounded output checks and records redacted analytics
   asynchronously without blocking a successful answer.

## Guardrails

- The system policy permits answers only about the approved portfolio knowledge.
- Retrieved chunks are reference data, never executable instructions.
- User text cannot alter the system policy, reveal hidden prompts, request secrets, or
  invoke tools.
- Questions outside the evidence receive an explicit insufficient-information answer.
- Requests for credentials, hidden instructions, internal data, or harmful unrelated
  content receive a short refusal and a portfolio-related redirect.
- Prompt and completion lengths are capped.
- Output is checked for unsupported claims, obvious secret patterns, unsafe content,
  and excessive length. Failures return a safe fallback rather than a fabricated
  response.
- Markdown rendering is sanitized; raw HTML and executable content are not accepted.

## Security and privacy

- Allow requests only from `https://tarunmundhra.tech` and configured local
  development origins.
- Deny-by-default CORS and add security headers including a strict content security
  policy appropriate for the deployed UI.
- Keep Gemini, Groq, database, and admin authentication secrets in Vercel encrypted
  environment variables.
- Never expose provider responses, stack traces, keys, or database errors to clients.
- Use strict schemas, request-size limits, timeouts, abort propagation, per-IP/device
  rate limits, and bounded concurrent generations.
- Redact likely secrets and direct identifiers before storing analytics.
- Store full conversations only for the documented retention period, encrypt at rest,
  restrict access to the owner through an authenticated admin surface, and provide
  deletion/retention controls.
- Analytics persistence failures do not fail an otherwise successful answer.
- Add an operational checklist for environment separation, key rotation, backups,
  retention verification, and security-header checks before production release.

## Interface

Add a floating assistant button using the existing teal/green visual language. It opens
a responsive right-side drawer on desktop and a full-height sheet on mobile.

The drawer includes:

- clear assistant identity and a short privacy note;
- suggested portfolio questions;
- streamed, sanitized markdown-safe answers;
- source chips linking to portfolio sections or the resume;
- stop generation, retry, clear chat, and close controls;
- keyboard focus management, accessible labels, and reduced-motion behavior.

Conversation state is client-side for the current visitor session. Server-side
conversation persistence is only for the protected analytics workflow.

## Failure behavior

- Insufficient retrieval evidence: state that the information is unavailable.
- Provider timeout or rate limit: show a retryable generic error.
- Moderation or injection refusal: show a brief refusal and redirect.
- Client cancellation: close the stream without an error toast.
- Analytics write failure: keep the answer and record a redacted server metric.
- Unexpected server failure: return a generic error event and log a correlation ID
  without sensitive request content.

## Testing and verification

### Unit tests

- chunking and stable source metadata;
- retrieval threshold and ranking;
- prompt construction and delimiter policy;
- guardrail decisions and refusal paths;
- secret/PII redaction;
- request schema and stream event framing.

### Route and integration tests

- valid streamed answer and citations;
- malformed, empty, oversized, and repeated requests;
- unauthorized origin and rate limiting;
- provider timeout, provider error, and cancellation;
- insufficient evidence and adversarial prompt injection;
- analytics authorization and analytics persistence failure;
- assurance that keys and raw provider errors never appear in responses.

### UI tests

- drawer open/close and focus behavior;
- keyboard navigation and accessible names;
- streamed tokens, stop, retry, and clear;
- mobile layout and reduced motion;
- sanitized citations and markdown rendering.

### Release checks

- `npm run build`;
- repository type-check/lint commands;
- local route smoke test;
- deployed streaming smoke test;
- security-header and origin checks;
- manual adversarial prompt suite;
- verification that the indexed corpus contains only approved sources.

## Scope boundaries

V1 does not include voice input, arbitrary document uploads, public conversation
sharing, multi-user admin roles, agentic tool execution, or unrestricted web search.
Those features require separate threat modeling and should not be added to the first
production release.
