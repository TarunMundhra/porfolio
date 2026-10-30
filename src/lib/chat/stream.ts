import type { Citation, StreamEvent } from "@/lib/chat/contracts";

const encoder = new TextEncoder();

export interface ChatStreamOptions {
  requestId: string;
  generate: AsyncIterable<string>;
  citations?: ReadonlyArray<Citation>;
  onCancel?: () => void | PromiseLike<void>;
  releaseSlot?: () => void;
}

function encode(event: StreamEvent): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

function errorEvent(error: unknown): StreamEvent {
  type ErrorCode = Extract<StreamEvent, { type: "error" }>["code"];
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["invalid_request", "rate_limited", "unavailable", "refused", "internal"].includes(
      String(error.code),
    )
      ? (String(error.code) as ErrorCode)
      : ("internal" as ErrorCode);
  const message = code === "unavailable" ? "Provider unavailable" : "Unable to complete response";
  return { type: "error", code, message };
}

export function createChatStream(options: ChatStreamOptions): ReadableStream<Uint8Array> {
  const iterator = options.generate[Symbol.asyncIterator]();
  const seenCitations = new Set<string>();
  let cancelled = false;
  let released = false;
  let terminal = false;

  const release = () => {
    if (!released) {
      released = true;
      options.releaseSlot?.();
    }
  };

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encode({ type: "start", requestId: options.requestId }));
    },
    async pull(controller) {
      if (cancelled || terminal) return;
      try {
        const next = await iterator.next();
        if (cancelled) return;
        if (!next.done) {
          controller.enqueue(encode({ type: "token", value: next.value }));
          return;
        }
        for (const citation of options.citations ?? []) {
          const key = JSON.stringify(citation);
          if (!seenCitations.has(key)) {
            seenCitations.add(key);
            controller.enqueue(encode({ type: "citation", citation }));
          }
        }
        terminal = true;
        controller.enqueue(encode({ type: "done", requestId: options.requestId }));
        controller.close();
        release();
      } catch (error) {
        if (cancelled || terminal) return;
        terminal = true;
        controller.enqueue(encode(errorEvent(error)));
        controller.close();
        release();
      }
    },
    cancel() {
      cancelled = true;
      try {
        const cancellation = options.onCancel?.();
        if (cancellation) void Promise.resolve(cancellation).catch(() => undefined);
      } catch {
        // Cancellation must still release capacity.
      } finally {
        release();
      }
      void Promise.resolve()
        .then(() => iterator.return?.())
        .catch(() => undefined);
    },
  });
}
