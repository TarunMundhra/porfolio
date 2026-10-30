import postgres from "postgres";

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
import type { Citation, StreamEvent } from "@/lib/chat/contracts";

const encoder = new TextEncoder();
const MAX_BODY_BYTES = 32_000;

interface Runtime {
  config: ChatConfig;
  database: ChatDatabase;
  embedder: GeminiEmbedder;
  streamer: GroqStreamer;
  analytics: ReturnType<typeof createAnalytics>;
  rateLimiter: ReturnType<typeof createRateLimiter>;
  inFlight: ReturnType<typeof createInFlightCounter>;
}

let runtime: Runtime | undefined;

function getRuntime(): Runtime {
  if (runtime) return runtime;
  const config = parseChatConfig();
  const sql = postgres(config.databaseUrl);
  const database = createChatDatabase(sql as never);
  runtime = {
    config,
    database,
    embedder: createGeminiEmbedder(config),
    streamer: createGroqStreamer({ ...config, timeoutMs: 15_000 }),
    analytics: createAnalytics({ database }),
    rateLimiter: createRateLimiter({
      limit: config.rateLimitPerMinute,
      windowMs: 60_000,
    }),
    inFlight: createInFlightCounter(16),
  };
  return runtime;
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
      "Cache-Control": "no-cache",
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
          ? "I can't help with that request."
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

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

function citationsFor(chunks: ReadonlyArray<{
  sourceId: string;
  title: string;
  url: string;
  section?: string;
}>): Citation[] {
  return chunks.map(({ sourceId, title, url, section }) => ({
    sourceId,
    title,
    url,
    ...(section ? { section } : {}),
  }));
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = createCorrelationId();
  let current: Runtime;
  try {
    current = getRuntime();
  } catch {
    logFailure(correlationId, "runtime", "internal");
    return errorResponse("internal", 500, correlationId);
  }

  const contentType = request.headers.get("content-type")?.trim() ?? "";
  const contentTypeParts = contentType.split(";").map((part) => part.trim());
  const validContentType =
    contentTypeParts[0].toLowerCase() === "application/json" &&
    contentTypeParts.slice(1).every((parameter) =>
      /^[A-Za-z0-9!#$%&'*+.^_`|~-]+=[A-Za-z0-9!#$%&'*+.^_`|~:/? -]+$/.test(parameter),
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
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return errorResponse("invalid_request", 413, correlationId);
    }
    input = parseChatRequest(JSON.parse(body));
    if (input.question.length > current.config.maxInputChars) {
      return errorResponse("invalid_request", 413, correlationId);
    }
  } catch {
    return errorResponse("invalid_request", 400, correlationId);
  }

  if (!current.rateLimiter.allow(clientKey(request))) {
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
    return errorResponse("refused", 200, correlationId);
  }

  let chunks;
  try {
    const [embedding] = await current.embedder.embed([input.question]);
    chunks = await current.database.retrieveChunks(embedding, {
      limit: 6,
      minimumSimilarity: 0.65,
    });
  } catch {
    current.inFlight.release();
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
            controller.enqueue(encoder.encode(`${JSON.stringify({ type: "token", value: assembled })}\n`));
          }
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "done", requestId: correlationId })}\n`));
          controller.close();
          finished = true;
          release();
          return;
        }
        if (!iterator) {
          iterator = current.streamer.generate(prompt, requestController.signal)[Symbol.asyncIterator]();
        }
        const next = await iterator.next();
        if (!next.done) {
          assembled += next.value;
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "token", value: redactForAnalytics(next.value) })}\n`));
          return;
        }
        const validated = validateAnswer(assembled, chunks);
        if (validated.kind === "fallback" && chunks.length) {
          finished = true;
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", code: "internal", message: "Unable to complete response", correlationId })}\n`));
          controller.close();
          logFailure(correlationId, "validation", "internal");
          release();
          return;
        }
        for (const citation of chunks.length ? citations : []) {
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "citation", citation })}\n`));
        }
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "done", requestId: correlationId })}\n`));
        controller.close();
        finished = true;
        release();
        void current.analytics.recordConversation(createRedactedConversationRecord({
          conversationId: correlationId,
          ownerId: clientKey(request),
          retentionDays: current.config.analyticsRetentionDays,
          messages: [
            { role: "user", content: input.question },
            { role: "assistant", content: validated.answer, error: false },
          ],
        }));
      } catch {
        if (finished) return;
        finished = true;
        logFailure(correlationId, "generation", "unavailable");
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
      release();
    },
  });
  return response(body, 200);
}
