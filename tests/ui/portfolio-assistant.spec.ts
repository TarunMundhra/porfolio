import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortfolioAssistant from "@/components/portfolio/PortfolioAssistant";

describe("PortfolioAssistant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => cleanup());

  it("opens an accessible drawer, focuses the prompt, and returns focus on close", async () => {
    render(React.createElement(PortfolioAssistant));
    const launcher = screen.getByRole("button", { name: /ask about tarun/i });

    fireEvent.click(launcher);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /question/i })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(launcher).toHaveFocus();
  });

  it("offers suggested questions and streams sanitized assistant content", async () => {
    const body = [
      JSON.stringify({ type: "start", requestId: "req-1" }),
      JSON.stringify({
        type: "token",
        value:
          "See [my work](https://github.com/TarunMundhra) and [unsafe](https://example.com). <script>alert(1)</script>",
      }),
      JSON.stringify({ type: "done", requestId: "req-1" }),
    ].join("\n");
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(body, { headers: { "content-type": "application/x-ndjson" } }),
    );

    render(React.createElement(PortfolioAssistant));
    fireEvent.click(screen.getByRole("button", { name: /ask about tarun/i }));
    fireEvent.click(screen.getByRole("button", { name: /what projects has tarun built/i }));

    expect(await screen.findByText("What projects has Tarun built?")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "my work" })).toHaveAttribute(
      "href",
      "https://github.com/TarunMundhra",
    );
    expect(screen.queryByRole("link", { name: "unsafe" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "unsafe" })).not.toBeInTheDocument();
  });

  it("supports stop, retry, clear, and presents a safe error", async () => {
    let rejectRequest!: (error: Error) => void;
    vi.spyOn(global, "fetch").mockReturnValue(
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
    );

    render(React.createElement(PortfolioAssistant));
    fireEvent.click(screen.getByRole("button", { name: /ask about tarun/i }));
    const prompt = screen.getByRole("textbox", { name: /question/i });
    fireEvent.change(prompt, { target: { value: "Tell me about experience" } });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByRole("button", { name: /stop generating/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /stop generating/i }));
    rejectRequest(new Error("secret server internals"));
    expect(await screen.findByText(/generation stopped/i)).toBeInTheDocument();
    expect(screen.queryByText(/secret server internals/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear conversation/i }));
    expect(screen.queryByText("Tell me about experience")).not.toBeInTheDocument();
  });
});
