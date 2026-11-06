"use client";

import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import GlassCard from "./GlassCard";
import {
  Calendar,
  Users,
  MonitorSmartphone,
  ShieldCheck,
  ArrowRight,
  Briefcase,
  Layers,
  Sparkles,
} from "lucide-react";

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface Experience {
  title: string;
  organization: string;
  role: string;
  period: string;
  icon: React.ReactNode;
  accentColor: string;
  description: string;
  highlights: string[];
  tech: string[];
  links: { label: string; href: string }[];
}

const experiences: Experience[] = [
  {
    title: "JuryAssist (Product by Veritos)",
    organization: "Veritos | UK Legal Tech Platform",
    role: "Founding Engineer",
    period: "Aug 2026 – Present",
    icon: <Sparkles size={22} />,
    accentColor: "#22c55e",
    description:
      "Spearheaded 0-to-1 systems architecture of an agentic AI UK legal platform, scaling adoption to 10,294 active users across top law firms.",
    highlights: [
      "Spearheaded 0-to-1 architecture of an agentic AI UK legal platform, scaling adoption to 10,294 active users across top law firms.",
      "Built zero-knowledge AI platform with 6-LLM consensus, distributed state locking & HMAC-verified idempotent payment webhooks.",
      "Drove product-led growth strategy platform-wide, boosting user adoption and premium-tier conversions across the client base.",
      "Eliminated 100% of LLM hallucinated obligations using an automated lexical overlap verification layer (Jaccard similarity thresholding) coupled with a zero-persistence PII tokenisation vault.",
    ],
    tech: [
      "TypeScript",
      "Next.js",
      "Node.js",
      "PostgreSQL",
      "6-LLM Consensus",
      "Temporal.io",
      "HMAC",
      "Distributed Systems",
    ],
    links: [],
  },
  {
    title: "Quick Dry Cleaning Software (DC Web Services)",
    organization: "DC Web Services Pvt. Ltd.",
    role: "Software Development Engineer",
    period: "May 2026 – Nov 2026",
    icon: <Briefcase size={22} />,
    accentColor: "#11998e",
    description:
      "Engineered core backend microservices, access control architectures, and high-performance event pipelines for an AI-first, multi-tenant B2B SaaS platform.",
    highlights: [
      "Re-architected the access control model from flat user-store mapping to hierarchical ReBAC, eliminating O(N) database record duplication across multi-store franchise expansions.",
      "Authored 83 production commits (+15,300 lines of code) across 6 microservices, maintaining zero-regression security across tenant boundaries with PostgreSQL Row-Level Security (RLS).",
      "Cut hot-path authorization latency to near-zero by implementing in-memory LRU/TTL permission caching.",
      "Automated end-to-end type safety for 14+ granular permissions across API controllers via dynamic DB-driven TypeScript generation.",
      "Achieved comprehensive test coverage for mission-critical security workflows (JWT validators, privilege escalation guards, and territory hierarchy queries) using Vitest.",
      "Engineered real-time LiveKit voice AI agents with Temporal.io for fault-tolerant multi-step execution, and event-driven BullMQ/Redis worker queues.",
    ],
    tech: [
      "TypeScript",
      "NestJS",
      "Node.js",
      "PostgreSQL (RLS)",
      "Kysely ORM",
      "Temporal.io",
      "Docker",
      "Vitest",
      "ts-rest",
      "Centrifugo",
      "pnpm",
      "Turborepo",
    ],
    links: [],
  },
  {
    title: "AMRR TechSols Pvt Ltd",
    organization: "AMRR TechSols Pvt. Ltd.",
    role: "Software Development Engineer",
    period: "May 2026 – Jul 2026",
    icon: <Layers size={22} />,
    accentColor: "#38bdf8",
    description:
      "Built foundational AI risk engines, hybrid vector retrieval systems, and privacy-preserving document pipelines deployed at enterprise scale.",
    highlights: [
      "Cut contract ingestion latency from ~6 minutes down to under 20 seconds (>94% speedup) on 800+ page legal documents via bulk ONNX parallelization and batched vector upserts.",
      "Architected hybrid semantic search with pgvector HNSW indexing and BM25 Reciprocal Rank Fusion (RRF), hitting sub-50ms retrieval latencies across large-scale document corpora.",
      "Slashed vector calculation overhead by 4x and SQLite sync transactions by 90% by benchmarking and migrating to a 384-dimensional dense embedding model (BAAI/bge-small-en-v1.5).",
      "Eliminated 100% of LLM hallucinated obligations using an automated lexical overlap verification layer (Jaccard similarity thresholding) coupled with a zero-persistence PII tokenisation vault.",
      "Engineered end-to-end PII redaction pipeline with AES-256-GCM encryption, GDPR-ready architecture, and improved native document conversion quality by 70% with PyMuPDF.",
    ],
    tech: [
      "Python",
      "FastAPI",
      "LangChain",
      "PostgreSQL (pgvector)",
      "BM25",
      "ONNX",
      "PyMuPDF",
      "Docker",
      "AES-256-GCM",
    ],
    links: [],
  },
  {
    title: "Interhall GC-OpenSoft Competition",
    organization: "MMM Hall of Residence | IIT Kharagpur",
    role: "Vice-Captain & Engineering Lead",
    period: "2026",
    icon: <Users size={22} />,
    accentColor: "#a855f7",
    description:
      "Led a 20-member cross-functional development team to design and deliver a full-stack, institutional-grade algorithmic trading simulator under competitive inter-hall conditions at IIT Kharagpur.",
    highlights: [
      "Led a 20-member cross-functional development team to architect an institutional-grade algorithmic trading simulator.",
      "Engineered deterministic matching engine in Go enforcing price-time priority with Self-Trade Prevention (STP).",
      "Streamed real-time Level-2 order book depth via Go channels, Redis Pub/Sub, and WebSockets.",
    ],
    tech: [
      "Go",
      "Redis",
      "TimescaleDB",
      "PostgreSQL",
      "WebSockets",
      "Docker",
    ],
    links: [],
  },
  {
    title: "Hall Technical Committee",
    organization: "MMM Hall of Residence | IIT Kharagpur",
    role: "Technical Committee Member",
    period: "2026",
    icon: <MonitorSmartphone size={22} />,
    accentColor: "#eab308",
    description: "Organizing technical hackathons, software infrastructure, and competitive engineering initiatives at IIT Kharagpur.",
    highlights: [
      "Directed technical development events and infrastructure for 1,500+ campus residents.",
    ],
    tech: [],
    links: [],
  },
];

export default function ExperiencePage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto px-6 pb-20"
    >
      <motion.div variants={fadeInUp}>
        <SectionHeading
          title="Work Experience & Leadership"
          subtitle="Production software engineering, architecture, and leadership"
        />
      </motion.div>

      {/* Verified Experience & Documents Callout */}
      <motion.div variants={fadeInUp} className="mb-8">
        <GlassCard className="p-4 sm:p-5 border-[#11998e]/30 bg-[#11998e]/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-[#11998e]/20 text-[#22c55e] shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Verified Experience &amp; Engineering Credentials
                </h3>
                <p className="text-xs text-[#9ca3af]">
                  Official letters from Quick Dry Cleaning Software (DC Web Services) &amp; AMRR TechSols, plus updated CV.
                </p>
              </div>
            </div>
            <a
              href="/documents/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#085d56] to-[#00998c] text-white text-xs font-medium hover:opacity-95 transition-all whitespace-nowrap self-start sm:self-auto"
            >
              <span>View Documents</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </GlassCard>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="hidden md:block absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-[#085d56] via-[#11998e]/30 to-[#22c55e]/30" />

        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <motion.div key={exp.title} variants={fadeInUp} className="relative">
              {/* Timeline dot */}
              <div className="hidden md:flex absolute -left-[23px] top-8 w-[46px] h-[46px] rounded-full items-center justify-center z-10" style={{ backgroundColor: `${exp.accentColor}15`, border: `2px solid ${exp.accentColor}40` }}>
                <span style={{ color: exp.accentColor }}>{exp.icon}</span>
              </div>

              <GlassCard className="p-6 md:p-8">
                {/* Mobile icon */}
                <div className="md:hidden flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${exp.accentColor}15`,
                      border: `1px solid ${exp.accentColor}30`,
                    }}
                  >
                    <span style={{ color: exp.accentColor }}>{exp.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {exp.title}
                    </h3>
                  </div>
                </div>

                {/* Header */}
                <div className="hidden md:flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {exp.title}
                    </h3>
                    <p className="text-[#9ca3af] text-sm mt-0.5 flex items-center gap-1.5">
                      {exp.organization}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${exp.accentColor}15`,
                          color: exp.accentColor,
                        }}
                      >
                        {exp.role}
                      </span>
                      <span className="text-xs text-[#9ca3af] flex items-center gap-1">
                        <Calendar size={12} />
                        {exp.period}
                      </span>
                    </div>
                  </div>
                  {exp.links.length > 0 && (
                    <div className="flex items-center gap-2">
                      {exp.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#9ca3af] hover:text-[#11998e] hover:border-[#11998e]/40 transition-all"
                          aria-label={link.label}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile header details */}
                <div className="md:hidden mb-3">
                  <p className="text-[#9ca3af] text-sm">{exp.organization}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${exp.accentColor}15`,
                        color: exp.accentColor,
                      }}
                    >
                      {exp.role}
                    </span>
                    <span className="text-xs text-[#9ca3af] flex items-center gap-1">
                      <Calendar size={12} />
                      {exp.period}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[#9ca3af] text-sm leading-relaxed mb-4">
                  {exp.description}
                </p>

                {/* Highlights */}
                {exp.highlights.length > 0 && (
                  <ul className="space-y-2 mb-5">
                    {exp.highlights.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-[#e5e7eb]/80"
                      >
                        <span
                          className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${exp.accentColor}, #22c55e)`,
                          }}
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Tech Stack */}
                {exp.tech.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/[0.04]">
                    {exp.tech.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2.5 py-1 rounded-md bg-white/[0.04] text-[#9ca3af] font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
