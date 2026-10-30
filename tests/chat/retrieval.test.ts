import { describe, expect, it } from "vitest";
import { chunkDocument, selectRelevantChunks } from "@/lib/chat/retrieval";

describe("knowledge retrieval", () => {
  it("creates stable overlapping chunks with source metadata", () => {
    const document = {
      sourceId: "resume",
      title: "Tarun Mundhra Resume",
      url: "/Tarun-Mundhra-Resume.pdf",
      text: "A".repeat(900),
    } as const;

    const chunks = chunkDocument(document);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.sourceId === "resume")).toBe(true);
    expect(chunks.every((chunk) => chunk.text.length <= 500)).toBe(true);
    expect(new Set(chunks.map((chunk) => chunk.id)).size).toBe(chunks.length);
    expect(chunks).toEqual(chunkDocument(document));
  });

  it("preserves semantic sections when splitting content", () => {
    const chunks = chunkDocument({
      sourceId: "about",
      title: "About",
      url: "/#about",
      text: "# About\n\n" + "A".repeat(700) + "\n\n# Experience\n\n" + "B".repeat(700),
    });

    expect(chunks.some((chunk) => chunk.section === "About")).toBe(true);
    expect(chunks.some((chunk) => chunk.section === "Experience")).toBe(true);
    expect(chunks.every((chunk) => chunk.section === "About" || chunk.section === "Experience")).toBe(true);
  });

  it("returns no evidence when the best similarity is below the threshold", () => {
    expect(
      selectRelevantChunks(
        [{ id: "one", sourceId: "about", title: "About", url: "/#about", text: "trading", similarity: 0.41 }],
        { limit: 4, minimumSimilarity: 0.72 },
      ),
    ).toEqual([]);
  });

  it("sorts by similarity and applies the limit", () => {
    const chunks = [
      { id: "low", sourceId: "about", title: "About", url: "/#about", text: "low", similarity: 0.8 },
      { id: "high", sourceId: "about", title: "About", url: "/#about", text: "high", similarity: 0.95 },
      { id: "middle", sourceId: "about", title: "About", url: "/#about", text: "middle", similarity: 0.9 },
    ];

    expect(selectRelevantChunks(chunks, { limit: 2, minimumSimilarity: 0.75 }).map((chunk) => chunk.id)).toEqual([
      "high",
      "middle",
    ]);
  });
});
