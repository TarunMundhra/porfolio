import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import PortfolioAssistantPage from "@/components/portfolio/PortfolioAssistantPage";
import { PortfolioAssistantProvider } from "@/components/portfolio/PortfolioAssistantProvider";

describe("PortfolioAssistantPage", () => {
  afterEach(() => cleanup());

  it("presents a recruiter-focused full-page assistant using the shared conversation", () => {
    render(
      React.createElement(
        PortfolioAssistantProvider,
        null,
        React.createElement(PortfolioAssistantPage),
      ),
    );

    expect(screen.getByRole("heading", { name: /ask tarun's portfolio ai/i })).toBeInTheDocument();
    expect(screen.getByText(/architecture, production impact, and role fit/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /question/i })).toHaveFocus();
    expect(screen.getByRole("link", { name: /back to portfolio/i })).toHaveAttribute("href", "/");
  });
});
