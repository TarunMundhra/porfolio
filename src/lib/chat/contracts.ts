export interface ChatRequest {
  question: string;
  history?: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
}

export interface Citation {
  sourceId: string;
  title: string;
  url: string;
  section?: string;
}

export interface RetrievedChunk extends Citation {
  id: string;
  text: string;
  similarity: number;
  contentHash?: string;
  embeddingModel?: string;
  sourcePath?: string;
  chunkOrdinal?: number;
  sourceOffset?: number;
}

export type StreamEvent =
  | { type: "start"; requestId: string }
  | { type: "token"; value: string }
  | { type: "citation"; citation: Citation }
  | { type: "done"; requestId: string }
  | {
      type: "error";
      code: "invalid_request" | "rate_limited" | "unavailable" | "refused" | "internal";
      message: string;
    };

export interface KnowledgeDocument {
  readonly sourceId: string;
  readonly title: string;
  readonly url: string;
  readonly text: string;
  readonly sourcePath?: string;
  readonly section?: string;
}

export interface ChatCompletionResult {
  answer: string;
  citations: ReadonlyArray<Citation>;
}
