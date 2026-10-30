export type KnowledgeSourceKind = "markdown" | "tsx" | "text" | "pdf";

export interface KnowledgeSource {
  readonly sourceId: string;
  readonly title: string;
  readonly url: string;
  readonly sourcePath: string;
  readonly kind: KnowledgeSourceKind;
  readonly section: string;
}

export const KNOWLEDGE_MANIFEST = [
  {
    sourceId: "hero",
    title: "Tarun Mundhra portfolio",
    url: "/",
    sourcePath: "src/components/portfolio/HeroSection.tsx",
    kind: "tsx",
    section: "Home",
  },
  {
    sourceId: "about",
    title: "About Tarun Mundhra",
    url: "/#about",
    sourcePath: "src/components/portfolio/AboutPage.tsx",
    kind: "tsx",
    section: "About",
  },
  {
    sourceId: "experience",
    title: "Professional experience",
    url: "/#experience",
    sourcePath: "src/components/portfolio/ExperiencePage.tsx",
    kind: "tsx",
    section: "Experience",
  },
  {
    sourceId: "projects",
    title: "Portfolio projects",
    url: "/#projects",
    sourcePath: "src/components/portfolio/ProjectsPage.tsx",
    kind: "tsx",
    section: "Projects",
  },
  {
    sourceId: "contact",
    title: "Contact information",
    url: "/#contact",
    sourcePath: "src/components/portfolio/ContactPage.tsx",
    kind: "tsx",
    section: "Contact",
  },
  {
    sourceId: "resume",
    title: "Tarun Mundhra Resume",
    url: "/Tarun-Mundhra-Resume.pdf",
    sourcePath: "public/Tarun-Mundhra-Resume.pdf",
    kind: "pdf",
    section: "Resume",
  },
] as const satisfies readonly KnowledgeSource[];

export type KnowledgeManifestEntry = (typeof KNOWLEDGE_MANIFEST)[number];
