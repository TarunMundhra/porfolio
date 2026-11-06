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
      JSON.stringify({
        type: "citation",
        citation: {
          title: "Tarun Mundhra Resume",
          url: "/Tarun-Mundhra-Resume.pdf",
          section: "Resume",
        },
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
    expect(await screen.findByRole("link", { name: /tarun mundhra resume/i })).toHaveAttribute(
      "href",
      "/Tarun-Mundhra-Resume.pdf",
    );
  });

  it("deduplicates citations with identical URLs and titles without duplicate key warnings", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const body = [
      JSON.stringify({ type: "start", requestId: "req-dup" }),
      JSON.stringify({ type: "token", value: "Answer text" }),
      JSON.stringify({
        type: "citation",
        citation: { title: "Tarun Mundhra portfolio", url: "/" },
      }),
      JSON.stringify({
        type: "citation",
        citation: { title: "Tarun Mundhra portfolio", url: "/" },
      }),
      JSON.stringify({ type: "done", requestId: "req-dup" }),
    ].join("\n");
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(body, { headers: { "content-type": "application/x-ndjson" } }),
    );

    render(React.createElement(PortfolioAssistant));
    fireEvent.click(screen.getByRole("button", { name: /ask about tarun/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /question/i }), {
      target: { value: "Tell me about Tarun" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));

    expect(await screen.findByText("Answer text")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "Tarun Mundhra portfolio" });
    expect(links).toHaveLength(1);
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Encountered two children with the same key"),
      expect.anything(),
    );
    errorSpy.mockRestore();
  });

  it("logs first_response_byte when the first body chunk arrives", async () => {
    let enqueue!: (chunk: Uint8Array) => void;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        enqueue = (chunk) => controller.enqueue(chunk);
      },
    });
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(stream));

    render(React.createElement(PortfolioAssistant));
    fireEvent.click(screen.getByRole("button", { name: /ask about tarun/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /question/i }), {
      target: { value: "Tell me about projects" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));

    await waitFor(() => expect(log).toHaveBeenCalledWith("[chat] prompt_sent"));
    expect(log).not.toHaveBeenCalledWith("[chat] first_response_byte", expect.anything());

    enqueue(new Uint8Array());
    await waitFor(() => expect(log).toHaveBeenCalledTimes(1));
    expect(log).not.toHaveBeenCalledWith("[chat] first_response_byte", expect.anything());

    enqueue(new TextEncoder().encode(`${JSON.stringify({ type: "done" })}\n`));
    await waitFor(() => expect(log).toHaveBeenCalledWith("[chat] first_response_byte", expect.anything()));
    log.mockRestore();
  });

  it("logs first_token only for a non-empty token value", async () => {
    let enqueue!: (chunk: Uint8Array) => void;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        enqueue = (chunk) => controller.enqueue(chunk);
      },
    });
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(stream));

    render(React.createElement(PortfolioAssistant));
    fireEvent.click(screen.getByRole("button", { name: /ask about tarun/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /question/i }), {
      target: { value: "Tell me about projects" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));

    await waitFor(() => expect(log).toHaveBeenCalledWith("[chat] prompt_sent"));
    enqueue(new TextEncoder().encode(`${JSON.stringify({ type: "token", value: "" })}\n`));
    await waitFor(() => expect(log).toHaveBeenCalledWith("[chat] first_response_byte", expect.anything()));
    expect(log).not.toHaveBeenCalledWith("[chat] first_token", expect.anything());

    enqueue(
      new TextEncoder().encode(
        `${JSON.stringify({ type: "token", value: "Answer" })}\n${JSON.stringify({ type: "done" })}\n`,
      ),
    );
    await waitFor(() => expect(screen.getByText("Answer")).toBeInTheDocument());
    expect(log).toHaveBeenCalledWith("[chat] first_token", expect.anything());
    expect(log.mock.calls.filter(([event]) => event === "[chat] first_token")).toHaveLength(1);
  });

  it("stops an in-flight response without an error and preserves partial content", async () => {
    let resolveRequest!: (response: Response) => void;
    vi.spyOn(global, "fetch").mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));

    render(React.createElement(PortfolioAssistant));
    fireEvent.click(screen.getByRole("button", { name: /ask about tarun/i }));
    const prompt = screen.getByRole("textbox", { name: /question/i });
    fireEvent.change(prompt, { target: { value: "Tell me about experience" } });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByRole("button", { name: /stop generating/i })).toBeInTheDocument();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`${JSON.stringify({ type: "token", value: "Partial answer" })}\n`));
      },
    });
    resolveRequest(new Response(stream));
    expect(await screen.findByText("Partial answer")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /stop generating/i }));
    expect(screen.getByText("Partial answer")).toBeInTheDocument();
    expect(screen.queryByText(/generation stopped|unable to complete/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear conversation/i }));
    expect(screen.queryByText("Tell me about experience")).not.toBeInTheDocument();
  });

  it("traps Tab navigation inside the dialog and does not focus the launcher on mount", () => {
    render(React.createElement(PortfolioAssistant));
    const launcher = screen.getByRole("button", { name: /ask about tarun/i });
    expect(launcher).not.toHaveFocus();
    fireEvent.click(launcher);
    const dialog = screen.getByRole("dialog");
    const close = screen.getAllByRole("button", { name: /close assistant/i })[1];
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>("button, input"));
    focusables[focusables.length - 1].focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(focusables[0]).toHaveFocus();
    focusables[0].focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(focusables[focusables.length - 1]).toHaveFocus();
    expect(close).toBeTruthy();
  });

  it("aborts and finalizes an active stream when the drawer closes or unmounts", async () => {
    const requestSignals: AbortSignal[] = [];
    let resolveRequest!: (response: Response) => void;
    vi.spyOn(global, "fetch").mockImplementation((_input, init) => {
      requestSignals.push(init?.signal as AbortSignal);
      return new Promise((resolve) => { resolveRequest = resolve; });
    });

    const rendered = render(React.createElement(PortfolioAssistant));
    fireEvent.click(screen.getByRole("button", { name: /ask about tarun/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /question/i }), {
      target: { value: "Tell me about projects" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`${JSON.stringify({ type: "token", value: "Partial" })}\n`));
      },
    });
    resolveRequest(new Response(stream));
    expect(await screen.findByText("Partial")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /close assistant/i })[1]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByLabelText("Assistant is typing")).not.toBeInTheDocument();
    expect(requestSignals[0].aborted).toBe(true);

    const second = render(React.createElement(PortfolioAssistant));
    fireEvent.click(screen.getAllByRole("button", { name: /ask about tarun/i })[1]);
    fireEvent.change(screen.getAllByRole("textbox", { name: /question/i })[0], {
      target: { value: "Tell me about experience" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));
    await waitFor(() => expect(requestSignals).toHaveLength(2));
    second.unmount();
    expect(requestSignals[1].aborted).toBe(true);
    rendered.unmount();
  });

  it("ignores queued stale events after cancellation when a newer request starts", async () => {
    let releaseFirstRead!: () => void;
    let calls = 0;
    vi.spyOn(global, "fetch").mockImplementation(() => {
      calls += 1;
      if (calls === 1) {
        let readCount = 0;
        const staleChunk = new TextEncoder().encode(
          `${JSON.stringify({ type: "token", value: "STALE TOKEN" })}\n${JSON.stringify({ type: "citation", citation: { title: "Stale source", url: "/#about" } })}\n`,
        );
        const reader = {
          read: () => {
            readCount += 1;
            if (readCount === 1) {
              return Promise.resolve({ done: false, value: new TextEncoder().encode(`${JSON.stringify({ type: "token", value: "First partial" })}\n`) });
            }
            return new Promise<{ done: false; value: Uint8Array }>((resolve) => {
              releaseFirstRead = () => resolve({ done: false, value: staleChunk });
            });
          },
          cancel: () => Promise.resolve(),
        };
        return Promise.resolve({ ok: true, body: { getReader: () => reader } } as unknown as Response);
      }
      const body = [
        JSON.stringify({ type: "token", value: "Current answer" }),
        JSON.stringify({ type: "citation", citation: { title: "Current source", url: "/#projects" } }),
        JSON.stringify({ type: "done" }),
      ].join("\n");
      return Promise.resolve(new Response(body));
    });

    render(React.createElement(PortfolioAssistant));
    fireEvent.click(screen.getByRole("button", { name: /ask about tarun/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /question/i }), {
      target: { value: "First question" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText("First partial")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /stop generating/i }));
    releaseFirstRead();

    fireEvent.change(screen.getByRole("textbox", { name: /question/i }), {
      target: { value: "Second question" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText("Current answer")).toBeInTheDocument();
    expect(screen.queryByText("STALE TOKEN")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /stale source/i })).not.toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /current source/i })).toHaveAttribute("href", "/#projects");
  });
});
