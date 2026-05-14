"use client";

import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import GlassCard from "./GlassCard";
import { ExternalLink, Github } from "lucide-react";

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

interface Project {
  title: string;
  emoji: string;
  description: string;
  highlights: string[];
  tech: string[];
  links: { label: string; href: string }[];
}

const projects: Project[] = [
  {
    title: "KGP Presence",
    emoji: "📱",
    description:
      "An academic tracker mobile app for IIT Kharagpur with cross-platform React Native (Expo) and a serverless AWS Lambda backend.",
    highlights: [
      "Architected a cross-platform attendance tracker using React Native (Expo) and AWS Lambda, driving the project from ideation to a preview build",
      "Co-developed an OCR-powered timetable generator with a flexible manual creation mode",
      "Streamlined course integration via subject-code auto-fetch and an animated NativeWind UI",
      "Designed one-click attendance logging with real-time analytics by semester, subject, and timetable using TanStack Query",
      "Built a dashboard with event-tracking notifications and voice controls via Sarvam STT and Groq API JSON parsing",
      "Secured the Node.js/Express backend with JWT, bcrypt, and OTP-based email verification",
    ],
    tech: [
      "React Native (Expo)",
      "MongoDB",
      "AWS Lambda",
      "Node.js",
      "Express.js",
      "NativeWind",
      "TanStack Query",
    ],
    links: [
      { label: "View Code", href: "https://github.com/TarunMundhra" },
    ],
  },
  {
    title: "Algorithmic Trading Simulator",
    emoji: "📈",
    description:
      "A full-stack trading simulator with deterministic matching, automated market agents, and real-time market data streaming.",
    highlights: [
      "Built automated market agents including a synthetic market maker and a noise trader with momentum signals, packaged with single-click Docker containerization",
      "Developed a deterministic limit order book enforcing strict price-time priority with Self-Trade Prevention (STP)",
      "Implemented a real-time pipeline with Go channels and Redis Pub/Sub streaming Level-2 order book data via WebSockets",
      "Persisted transactional data in PostgreSQL with TimescaleDB partitioning for efficient historical queries",
    ],
    tech: [
      "Go",
      "Redis",
      "PostgreSQL",
      "TimescaleDB",
      "React",
      "WebSockets",
      "Docker",
    ],
    links: [
      { label: "View Code", href: "https://github.com/TarunMundhra" },
    ],
  },
  {
    title: "TaskFlow Pro",
    emoji: "⚙️",
    description:
      "A graph-based task management platform with dependency-aware scheduling and priority-driven execution.",
    highlights: [
      "Developed a full-stack task manager with graph-based dependency modeling",
      "Implemented cycle detection and topological sorting (O(V + E)) for valid task order",
      "Built a priority queue-driven scheduling engine using heap data structures",
      "Optimized backend performance by validating only affected subgraphs",
    ],
    tech: [
      "Node.js",
      "Express.js",
      "Graph Algorithms",
      "Priority Queue",
      "JWT",
    ],
    links: [
      { label: "View Code", href: "https://github.com/TarunMundhra" },
    ],
  },
];

export default function ProjectsPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto px-6 pb-20"
    >
      <motion.div variants={fadeInUp}>
        <SectionHeading
          title="Projects"
          subtitle="Selected works and personal projects"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {projects.map((project) => (
          <motion.div key={project.title} variants={fadeInUp}>
            <GlassCard className="p-6 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xl">{project.emoji}</span>
                  <h3 className="text-lg font-semibold text-white mt-1">
                    {project.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {project.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#9ca3af] hover:text-[#11998e] hover:border-[#11998e]/40 transition-all"
                      aria-label={link.label}
                    >
                      {link.label.includes("Code") ? (
                        <Github size={14} />
                      ) : (
                        <ExternalLink size={14} />
                      )}
                    </a>
                  ))}
                </div>
              </div>

              {/* Description */}
              <p className="text-[#9ca3af] text-sm leading-relaxed mb-4">
                {project.description}
              </p>

              {/* Highlights */}
              <ul className="space-y-2 mb-4 flex-1">
                {project.highlights.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-[#e5e7eb]/80"
                  >
                    <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#085d56] to-[#22c55e]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-white/[0.04]">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-md bg-white/[0.04] text-[#9ca3af] font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
