# Project: Portfolio Assistant HR, Behavioral & Career Motivation Query Enhancement

## Architecture
The portfolio assistant is a streaming Next.js conversational AI application with pgvector retrieval and strict guardrails.
- **Client UI** (`src/components/portfolio/PortfolioAssistant.tsx`, `AssistantMessage.tsx`):
  Floating trigger button and modal dialog streaming NDJSON events (`start`, `token`, `citation`, `error`, `done`).
- **HTTP Transport & Security** (`src/app/api/chat/route.ts`, `src/lib/chat/security.ts`):
  CORS origin validation, Content-Type enforcement, 32KB request limit, 10KB output budget, rate limiting, and in-flight concurrency control.
- **Guardrails & Classification** (`src/lib/chat/guardrails.ts`):
  Pre-retrieval assessment (`assessQuestion`) identifying prompt injection, harm/malware, portfolio inquiries, and deflection candidates. System prompt construction (`buildGroundedPrompt`) isolating input in XML tags. Post-generation citation validation (`validateAnswer`) enforcing valid numeric citations and absence of secrets/HTML.
- **Knowledge Retrieval & Vector Store** (`src/lib/chat/db.ts`, `src/data/knowledge/manifest.ts`):
  pgvector cosine similarity search over 6 approved sources (`HeroSection.tsx`, `AboutPage.tsx`, `ExperiencePage.tsx`, `ProjectsPage.tsx`, `ContactPage.tsx`, `Tarun-Mundhra-Resume.pdf`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | HR & Behavioral Scope Recognition | `assessQuestion` recognizes interview/behavioral terms ("why should I hire you", "strength", "weakness", "fit", "candidate", "qualification", etc.) as portfolio queries | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Career Motivation Scope Recognition | `assessQuestion` recognizes career origin/motivation terms ("why did you took software field", "why choose software engineering", "journey", "transition") as portfolio queries | M1 | ORIGINAL_REQUEST §R1 |
| F3 | Irrelevant Personal Inquiry Deflection Classification | `assessQuestion` classifies demographic/personal queries ("what is your gender", "what is your age") as `{ kind: "deflect", reason: "personal" }` | M1 | ORIGINAL_REQUEST §R2 |
| F4 | Guardrail Integrity Preservation | Prompt injection (`system prompt`, `reveal`, `jailbreak`) and harm/malware filters remain strictly prioritized before scope matching | M1 | ORIGINAL_REQUEST §R3 |
| F5 | Second-Person HR Prompt Framing | `buildGroundedPrompt` guides second-person interview answers ("you", "your strength"), framing strengths with deep technical depth, ReBAC, latency reduction, and leadership | M1 | ORIGINAL_REQUEST §R1 |
| F6 | Constructive Weakness & Growth Framing | `buildGroundedPrompt` guides positive, constructive framing for weaknesses (e.g., balancing degree in Exploration Geophysics with self-taught SDE mastery, scope balancing) | M1 | ORIGINAL_REQUEST §R1 |
| F7 | Career Journey & Motivation Framing | `buildGroundedPrompt` guides answers explaining Tarun's transition from IIT Kharagpur Geophysics to building high-throughput systems, JuryAssist, and Play Store apps | M1 | ORIGINAL_REQUEST §R1 |
| F8 | Empathetic Tone & Polite Apology Directives | `buildGroundedPrompt` instructs empathetic tone, apologizing politely if specific sensitive details are unavailable | M1 | ORIGINAL_REQUEST §R2 |
| F9 | Streaming Polite Deflection Route Handler | `route.ts` handles `assessment.kind === "deflect"` by streaming a warm, polite deflection refocusing on Tarun's technical achievements without error status | M2 | ORIGINAL_REQUEST §R2 |
| F10 | Grounding Fallback for HR Queries | `route.ts` ensures that when HR/behavioral questions are asked, candidate profile evidence (About/Experience/Resume chunks) is provided for grounding and citations | M2 | ORIGINAL_REQUEST §R1 |
| F11 | Citation Validation Compatibility | Validated answers for HR queries pass `validateAnswer` with valid evidence citations `[1]`, `[2]` | M2 | ORIGINAL_REQUEST §R3 |
| F12 | Comprehensive Test Suite Integration | Automated Vitest tests in `tests/chat/guardrails.test.ts` and `tests/chat/route.test.ts` for all 5 target phrases and variations | M3 | ORIGINAL_REQUEST §Test Verification |
| F13 | Full Regression & Security Verification | 100% of existing tests pass, prompt injection tests pass, no regression on existing queries | M4 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Guardrail Classification & Prompt Enhancement | Update `assessQuestion`, `QuestionAssessment`, and `buildGroundedPrompt` in `src/lib/chat/guardrails.ts` (Features F1, F2, F3, F4, F5, F6, F7, F8) | none | DONE |
| M2 | Route Handling, Deflection Streaming & Retrieval Grounding | Update `src/app/api/chat/route.ts` to stream polite deflections and provide grounding fallback for HR queries (Features F9, F10, F11) | M1 | DONE |
| M3 | E2E and Integration Test Suite Extension | Create comprehensive test dataset and integration tests in `tests/chat/` for all target phrases and variations (Feature F12) | M1, M2 | DONE |
| M4 | Final Verification, Hardening & Integrity Audit | Full test pass (`npm test`, `npm run type-check`, `npm run build`), adversarial challenge, and forensic audit (Feature F13) | M1, M2, M3 | DONE |

## Interface Contracts

### Guardrails ↔ Route Handler (`src/lib/chat/guardrails.ts` -> `src/app/api/chat/route.ts`)
- `QuestionAssessment` type:
  ```typescript
  export type QuestionAssessment =
    | { kind: "invalid"; reason: "empty" | "oversized" }
    | { kind: "portfolio" }
    | { kind: "refuse"; reason: "injection" }
    | { kind: "deflect"; reason: "personal" }
    | { kind: "unsafe"; reason: "unrelated" };
  ```
- `assessQuestion(question: string): QuestionAssessment`:
  1. Check empty / oversized.
  2. Check prompt injection regex -> `{ kind: "refuse", reason: "injection" }`.
  3. Check harm / exploit regex -> `{ kind: "unsafe", reason: "unrelated" }`.
  4. Check irrelevant personal inquiry regex (`\b(gender|sex|marital|religion|caste|ethnicity|age|sexual orientation)\b`) -> `{ kind: "deflect", reason: "personal" }`.
  5. Check portfolio + HR/behavioral/career regex -> `{ kind: "portfolio" }`.
  6. Fallback -> `{ kind: "unsafe", reason: "unrelated" }`.
- `buildGroundedPrompt(question: string, evidence: ReadonlyArray<AnswerEvidence>): string`:
  Includes second-person interview handling, positive strength framing, constructive weakness framing, career motivation framing from Geophysics to SDE, and empathetic tone directives.
- `validateAnswer(answer: string, evidence: ReadonlyArray<AnswerEvidence>): AnswerValidation`:
  Retains existing strict numeric bracket validation and secrets/HTML rejection.

### Route Handler ↔ Client UI Stream (`src/app/api/chat/route.ts` -> `src/components/portfolio/PortfolioAssistant.tsx`)
- When `assessment.kind === "deflect"`:
  Emits NDJSON stream:
  `{"type":"start","requestId":"..."}`
  `{"type":"token","value":"I don't track or focus on personal details like gender—my role is to represent Tarun's professional work and software engineering background. I'd be glad to tell you about his experience building distributed systems, his legal tech platform, or his project portfolio!"}`
  `{"type":"done","requestId":"..."}`
  HTTP status 200 (not an error or refused status).
- When `assessment.kind === "portfolio"`:
  Streams tokens backed by evidence citations `[1]`, followed by `{ type: "citation", citation: ... }` and `{ type: "done" }`.

## Code Layout
- `src/lib/chat/guardrails.ts`: Assessment logic, prompt generation, answer validation. (Owned by M1)
- `src/app/api/chat/route.ts`: API route handler, streaming logic, deflection response, retrieval coordination. (Owned by M2)
- `tests/chat/guardrails.test.ts`: Unit tests for question assessment and prompt construction. (Owned by M3)
- `tests/chat/route.test.ts`: Integration tests for chat route responses, streaming, deflection, and citations. (Owned by M3)
- `tests/chat/adversarial.test.ts`: Adversarial injection and security tests. (Owned by M4)
