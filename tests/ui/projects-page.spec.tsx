import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import ProjectsPage from "@/components/portfolio/ProjectsPage";

describe("ProjectsPage", () => {
  afterEach(() => cleanup());

  it("shows the four flagship projects and omits early learning projects", () => {
    render(React.createElement(ProjectsPage));

    expect(screen.getByText("JuryAssist - Agentic AI Legal Platform")).toBeInTheDocument();
    expect(screen.getByText("KGP Presence")).toBeInTheDocument();
    expect(screen.getByText("Low-Latency AI Video Streaming Engine")).toBeInTheDocument();
    expect(screen.getByText("Algorithmic Trading Simulator")).toBeInTheDocument();
    expect(screen.queryByText("GigFlow")).not.toBeInTheDocument();
    expect(screen.queryByText("TaskFlow Pro")).not.toBeInTheDocument();
  });
});
