import postgres from "postgres";

export const dynamic = "force-dynamic";

import { createAnalytics, createRedactedConversationRecord } from "@/lib/chat/analytics";
import { parseChatConfig, type ChatConfig } from "@/lib/chat/config";
import { createChatDatabase, type ChatDatabase } from "@/lib/chat/db";
import {
  assessQuestion,
  buildGroundedPrompt,
  validateAnswer,
} from "@/lib/chat/guardrails";
import {
  createCorrelationId,
  createInFlightCounter,
  createRateLimiter,
  getSecurityHeaders,
  isAllowedOrigin,
  parseChatRequest,
  redactForAnalytics,
} from "@/lib/chat/security";
import { createGeminiEmbedder, type GeminiEmbedder } from "@/lib/chat/providers/gemini";
import { createGroqStreamer, type GroqStreamer } from "@/lib/chat/providers/groq";
import { createSharedRateLimiter, type SharedRateLimiter } from "@/lib/chat/rate-limit";
import type { Citation, StreamEvent } from "@/lib/chat/contracts";

const encoder = new TextEncoder();
const MAX_BODY_BYTES = 32_000;
const MAX_OUTPUT_CHARS = 10_000;
const MAX_OUTPUT_BYTES = 40_000;

class RequestBodyTooLargeError extends Error {}

function splitContentType(value: string): string[] | undefined {
  const parts: string[] = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quoted && character === "\\") {
      escaped = true;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (character === ";" && !quoted) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  if (quoted || escaped) return undefined;
  parts.push(value.slice(start).trim());
  return parts;
}

async function readRequestBody(request: Request): Promise<string> {
  if (!request.body) throw new Error("Missing request body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel("request body too large");
        throw new RequestBodyTooLargeError();
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

interface Runtime {
  config: ChatConfig;
  database: ChatDatabase;
  embedder: GeminiEmbedder;
  streamer: GroqStreamer;
  analytics: ReturnType<typeof createAnalytics>;
  rateLimiter: SharedRateLimiter;
  inFlight: ReturnType<typeof createInFlightCounter>;
}

let runtime: Runtime | undefined;

function getRuntime(): Runtime {
  if (runtime) return runtime;
  const config = parseChatConfig();
  if (process.env.CHAT_TEST_MODE === "1") {
    const localRateLimiter = createRateLimiter({ limit: config.rateLimitPerMinute, windowMs: 60_000 });
    const chunk = {
      id: "test-project",
      sourceId: "test-project",
      title: "Test Project",
      url: "/projects/test",
      text: "Tarun built Project One.",
      similarity: 1,
    };
    runtime = {
      config,
      database: {
        retrieveChunks: async () => [chunk],
        persistConversation: async () => undefined,
        getConversation: async () => undefined,
        deleteConversation: async () => undefined,
        purgeExpired: async () => undefined,
      },
      embedder: { embed: async () => [[1]] },
      streamer: {
        generate: async function* (_prompt, signal) {
          if (_prompt.includes("provider error")) throw new Error("test provider failure");
          if (_prompt.includes("cancel stream")) {
            await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
            return;
          }
          yield "Tarun built Project One. [1]";
        },
      },
      analytics: createAnalytics({
        database: {
          persistConversation: async () => undefined,
        },
      }),
      rateLimiter: { allow: async (key) => localRateLimiter.allow(key) },
      inFlight: createInFlightCounter(16),
    };
    return runtime;
  }
  const sql = postgres(config.databaseUrl);
  const database = createChatDatabase(sql as never);
  const rateLimiter = process.env.NODE_ENV === "test"
    ? createRateLimiter({ limit: config.rateLimitPerMinute, windowMs: 60_000 })
    : undefined;
  runtime = {
    config,
    database,
    embedder: createGeminiEmbedder(config),
    streamer: createGroqStreamer({ ...config, timeoutMs: 15_000 }),
    analytics: createAnalytics({ database }),
    rateLimiter: rateLimiter
      ? { allow: async (key) => rateLimiter.allow(key) }
      : createSharedRateLimiter({
        sql: sql as never,
        limit: config.rateLimitPerMinute,
        windowMs: 60_000,
      }),
    inFlight: createInFlightCounter(16),
  };
  return runtime;
}

function recordOutcome(
  current: Runtime,
  input: { question: string },
  correlationId: string,
  outcome: { answer?: string; refused?: boolean; error?: boolean; providerStatus?: string; errorCode?: string },
): void {
  void current.analytics.recordConversation(createRedactedConversationRecord({
    conversationId: correlationId,
    ownerId: "public",
    retentionDays: current.config.analyticsRetentionDays,
    messages: [
      { role: "user", content: input.question },
      ...(outcome.answer !== undefined
        ? [{ role: "assistant" as const, content: outcome.answer, refused: outcome.refused, error: outcome.error }]
        : []),
    ],
    event: {
      correlationId,
      providerStatus: outcome.providerStatus,
      errorCode: outcome.errorCode,
    },
  }));
}

function eventBody(event: StreamEvent): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      controller.close();
    },
  });
}

function response(
  body: ReadableStream<Uint8Array>,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(body, {
    status,
    headers: {
      ...getSecurityHeaders(),
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
      ...extraHeaders,
    },
  });
}

function errorResponse(
  code: Extract<StreamEvent, { type: "error" }>["code"],
  status: number,
  correlationId?: string,
): Response {
  if (correlationId) logFailure(correlationId, "request", code);
  return response(eventBody({
    type: "error",
    code,
    message:
      code === "rate_limited"
        ? "Too many requests"
        : code === "refused"
          ? "I can only answer questions about Tarun's portfolio, background, and projects."
          : code === "invalid_request"
            ? "Invalid request"
            : code === "unavailable"
              ? "Provider unavailable"
              : "Unable to complete response",
    ...(correlationId ? { correlationId } : {}),
  }), status);
}

function logFailure(correlationId: string, stage: string, code: string): void {
  try {
    console.error(JSON.stringify({ correlationId, stage, code }));
  } catch {
    // Logging must never affect the response.
  }
}

function logTiming(
  correlationId: string,
  stage: "retrieval_completed" | "first_token" | "completed",
  startedAt: number,
): void {
  try {
    console.info(JSON.stringify({
      correlationId,
      stage,
      elapsedMs: Math.max(0, performance.now() - startedAt),
    }));
  } catch {
    // Logging must never affect the response.
  }
}

function clientKey(request: Request): string {
  const configuredHeader = getRuntime().config.trustedIdentityHeader;
  if (!configuredHeader || !/^[a-z0-9!#$%&'*+.^_`|~-]+$/.test(configuredHeader)) return "anonymous";
  const identity = request.headers.get(configuredHeader)?.trim();
  if (!identity || identity.length > 256 || /[\u0000-\u001f\u007f,\s]/.test(identity)) return "anonymous";
  return identity;
}

function citationsFor(chunks: ReadonlyArray<{
  sourceId: string;
  title: string;
  url: string;
  section?: string;
}>): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const { sourceId, title, url, section } of chunks) {
    const key = `${url}|${title}|${section ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({
        sourceId,
        title,
        url,
        ...(section ? { section } : {}),
      });
    }
  }
  return citations;
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = createCorrelationId();
  const startedAt = performance.now();
  let current: Runtime;
  try {
    current = getRuntime();
  } catch {
    logFailure(correlationId, "runtime", "internal");
    return errorResponse("internal", 500, correlationId);
  }

  const contentType = request.headers.get("content-type")?.trim() ?? "";
  const contentTypeParts = splitContentType(contentType);
  const validContentType =
    contentTypeParts !== undefined &&
    contentTypeParts[0].toLowerCase() === "application/json" &&
    contentTypeParts.slice(1).every((parameter) =>
      /^[A-Za-z0-9!#$%&'*+.^_`|~-]+=(?:"(?:[\t !#-\[\]-~]|\\[\t -~])*"|[A-Za-z0-9!#$%&'*+.^_`|~:/? -]+)$/.test(parameter),
    );
  if (!validContentType) {
    return errorResponse("invalid_request", 415, correlationId);
  }
  if (!isAllowedOrigin(request.headers.get("origin"), current.config.allowedOrigins)) {
    return errorResponse("invalid_request", 403, correlationId);
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_BODY_BYTES)) {
    return errorResponse("invalid_request", 413, correlationId);
  }

  let input: ReturnType<typeof parseChatRequest>;
  try {
    const body = await readRequestBody(request);
    input = parseChatRequest(JSON.parse(body));
    if (input.question.length > current.config.maxInputChars) {
      return errorResponse("invalid_request", 413, correlationId);
    }
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return errorResponse("invalid_request", 413, correlationId);
    }
    return errorResponse("invalid_request", 400, correlationId);
  }

  if (!(await current.rateLimiter.allow(clientKey(request)))) {
    return errorResponse("rate_limited", 429, correlationId);
  }
  if (!current.inFlight.tryAcquire()) {
    return errorResponse("rate_limited", 429, correlationId);
  }

  const assessment = assessQuestion(input.question);
  if (assessment.kind === "invalid") {
    current.inFlight.release();
    return errorResponse("invalid_request", 400, correlationId);
  }
  if (assessment.kind === "refuse") {
    current.inFlight.release();
    recordOutcome(current, input, correlationId, {
      answer: "I can only answer questions about Tarun's portfolio, background, and projects.",
      refused: true,
      providerStatus: "refused",
    });
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "start", requestId: correlationId })}\n`));
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", code: "refused", message: "I can't help with that request.", correlationId })}\n`));
        controller.close();
      },
    });
    return response(body, 200);
  }
  if (assessment.kind !== "portfolio") {
    current.inFlight.release();
    recordOutcome(current, input, correlationId, {
      answer: "I can only answer questions about Tarun's portfolio, background, and projects.",
      refused: true,
      providerStatus: "refused",
    });
    return errorResponse("refused", 200, correlationId);
  }

  let chunks;
  try {
    const [embedding] = await current.embedder.embed([input.question]);
    chunks = await current.database.retrieveChunks(embedding, {
      limit: 8,
      minimumSimilarity: 0.55,
    });
    logTiming(correlationId, "retrieval_completed", startedAt);
  } catch {
    current.inFlight.release();
    recordOutcome(current, input, correlationId, {
      answer: "Unable to complete response",
      error: true,
      errorCode: "unavailable",
      providerStatus: "retrieval",
    });
    logFailure(correlationId, "retrieval", "unavailable");
    return errorResponse("unavailable", 503, correlationId);
  }

  const release = (() => {
    let released = false;
    return () => {
      if (!released) {
        released = true;
        current.inFlight.release();
      }
    };
  })();
  let citations: Citation[];
  let prompt: string;
  try {
    if (!Array.isArray(chunks)) throw new Error("invalid retrieval result");
    citations = citationsFor(chunks);
    prompt = buildGroundedPrompt(input.question, chunks);
  } catch {
    logFailure(correlationId, "stream_setup", "internal");
    recordOutcome(current, input, correlationId, {
      answer: "Unable to complete response",
      error: true,
      errorCode: "internal",
      providerStatus: "validation",
    });
    release();
    return errorResponse("internal", 500, correlationId);
  }
  const requestController = new AbortController();
  let iterator: AsyncIterator<string> | undefined;
  let finished = false;
  let assembled = "";
  let started = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`${JSON.stringify({ type: "start", requestId: correlationId })}\n`));
    },
    async pull(controller) {
      if (finished) return;
      try {
        if (!chunks.length) {
          if (!started) {
            started = true;
            assembled = "I don't have that information.";
            logTiming(correlationId, "first_token", startedAt);
            controller.enqueue(encoder.encode(`${JSON.stringify({ type: "token", value: assembled })}\n`));
          }
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "done", requestId: correlationId })}\n`));
          controller.close();
          finished = true;
          logTiming(correlationId, "completed", startedAt);
          release();
          return;
        }
        if (!iterator) {
          iterator = current.streamer.generate(prompt, requestController.signal)[Symbol.asyncIterator]();
        }
        const next = await iterator.next();
        if (!next.done) {
          const nextChars = assembled.length + next.value.length;
          const nextBytes = encoder.encode(assembled).byteLength + encoder.encode(next.value).byteLength;
          if (nextChars > MAX_OUTPUT_CHARS || nextBytes > MAX_OUTPUT_BYTES) {
            requestController.abort();
            void Promise.resolve(iterator.return?.()).catch(() => undefined);
            finished = true;
            logFailure(correlationId, "output_budget", "internal");
            recordOutcome(current, input, correlationId, {
              answer: "Unable to complete response",
              error: true,
              errorCode: "internal",
              providerStatus: "output_budget",
            });
            controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", code: "internal", message: "Unable to complete response", correlationId })}\n`));
            controller.close();
            release();
            return;
          }
          assembled += next.value;
          if (!started && next.value.length > 0) {
            started = true;
            logTiming(correlationId, "first_token", startedAt);
          }
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "token", value: redactForAnalytics(next.value) })}\n`));
          return;
        }
        const validated = validateAnswer(assembled, chunks);
        if (validated.kind === "fallback" && chunks.length && !/^i (?:do not|don['’]t) have (?:that|information|enough)/i.test(assembled.trim())) {
          finished = true;
          recordOutcome(current, input, correlationId, {
            answer: "Unable to complete response",
            error: true,
            errorCode: "internal",
            providerStatus: "validation",
          });
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", code: "internal", message: "Unable to complete response", correlationId })}\n`));
          controller.close();
          logFailure(correlationId, "validation", "internal");
          release();
          return;
        }
        for (const citation of chunks.length && !/^i (?:do not|don['’]t) have (?:that|information|enough)/i.test(assembled.trim()) ? citations : []) {
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "citation", citation })}\n`));
        }
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "done", requestId: correlationId })}\n`));
        controller.close();
        finished = true;
        logTiming(correlationId, "completed", startedAt);
        release();
        recordOutcome(current, input, correlationId, {
          answer: validated.answer,
          providerStatus: "success",
        });
      } catch {
        if (finished) return;
        finished = true;
        logFailure(correlationId, "generation", "unavailable");
        recordOutcome(current, input, correlationId, {
          answer: "Provider unavailable",
          error: true,
          errorCode: "unavailable",
          providerStatus: "provider",
        });
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", code: "unavailable", message: "Provider unavailable", correlationId })}\n`));
        controller.close();
        release();
      }
    },
    cancel() {
      if (finished) return;
      finished = true;
      requestController.abort();
      void Promise.resolve(iterator?.return?.()).catch(() => undefined);
      recordOutcome(current, input, correlationId, {
        answer: "Request cancelled",
        error: true,
        errorCode: "cancelled",
        providerStatus: "cancelled",
      });
      release();
    },
  });
  return response(body, 200);
}
