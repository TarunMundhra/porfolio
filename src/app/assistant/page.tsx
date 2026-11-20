import type { Metadata } from "next";
import PortfolioAssistantPage from "@/components/portfolio/PortfolioAssistantPage";

export const metadata: Metadata = {
  title: "Ask Tarun's Portfolio AI | Software Development Engineer",
  description:
    "Ask evidence-backed questions about Tarun Mundhra's systems architecture, backend engineering, AI projects, professional experience, and fit for software engineering roles.",
  alternates: { canonical: "/assistant" },
  openGraph: {
    title: "Ask Tarun's Portfolio AI",
    description: "Explore Tarun Mundhra's engineering experience and production impact through an evidence-backed portfolio assistant.",
    url: "https://tarunmundhra.tech/assistant",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Ask Tarun's Portfolio AI",
    description: "Evidence-backed answers about Tarun Mundhra's software engineering work.",
  },
};

const assistantSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Tarun Mundhra Portfolio AI",
  url: "https://tarunmundhra.tech/assistant",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "An evidence-backed assistant for exploring Tarun Mundhra's software engineering portfolio, experience, and projects.",
  author: {
    "@type": "Person",
    name: "Tarun Mundhra",
    jobTitle: "Software Development Engineer",
    url: "https://tarunmundhra.tech/",
  },
};

export default function AssistantPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(assistantSchema) }} />
      <PortfolioAssistantPage />
    </>
  );
}
