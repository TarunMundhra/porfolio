import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import AssistantMessage from "@/components/portfolio/AssistantMessage";

describe("AssistantMessage", () => {
  afterEach(() => cleanup());

  it("labels sources, deduplicates citation destinations, and hides unapproved URLs", () => {
    render(React.createElement(AssistantMessage, {
      role: "assistant",
      content: "Tarun built production systems. [1]",
      citations: [
        { title: "Professional experience", section: "JuryAssist", url: "/#experience", indices: [1] },
        { title: "Professional experience", section: "Quick Dry", url: "/#experience", indices: [2] },
        { title: "Untrusted", url: "https://example.com/private", indices: [3] },
      ],
    }));

    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Professional experience" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Source 1: Professional experience" })).toHaveAttribute(
      "href",
      "/#experience",
    );
    expect(screen.queryByRole("link", { name: "Untrusted" })).not.toBeInTheDocument();
  });

  it("links grouped evidence markers and removes unmatched markers", () => {
    render(React.createElement(AssistantMessage, {
      role: "assistant",
      content: "Tarun delivers production systems [1, 2] without decorative references [9].",
      citations: [
        { title: "Experience", url: "/#experience", indices: [1] },
        { title: "Projects", url: "/#projects", indices: [2] },
      ],
    }));

    expect(screen.getByRole("link", { name: "Source 1: Experience" })).toHaveAttribute("href", "/#experience");
    expect(screen.getByRole("link", { name: "Source 2: Projects" })).toHaveAttribute("href", "/#projects");
    expect(screen.queryByText("[9]")).not.toBeInTheDocument();
  });

  it("does not show an empty sources section when every citation URL is unapproved", () => {
    render(React.createElement(AssistantMessage, {
      role: "assistant",
      content: "Tarun built production systems.",
      citations: [{ title: "Untrusted", url: "https://example.com/private", indices: [1] }],
    }));

    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
  });
});
