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
    title: "TasFlow",
    emoji: "⚡",
    description:
      "A full-stack task management platform with graph-based dependency management, modeling tasks as nodes and dependencies as directed edges with dynamic graph reconstruction.",
    highlights: [
      "Implemented cycle detection and topological sorting (O(V + E)) to compute valid task execution order",
      "Architected priority queue-driven scheduling engine using heap data structures to dynamically rank tasks by priority, deadlines, and dependency readiness",
      "Optimized backend performance by validating only affected subgraphs during dependency updates",
      "Built secure authentication and project-wise task management with JWT authorization",
    ],
    tech: ["Node.js", "Express.js", "Graph Algorithms", "Priority Queue", "JWT"],
    links: [
      { label: "View Code", href: "https://github.com/TarunMundhra" },
    ],
  },
  {
    title: "GigFlow",
    emoji: "🌊",
    description:
      "A dynamic freelance gig management platform enabling seamless connections between freelancers and clients with real-time project tracking, bidding workflows, and integrated payment management.",
    highlights: [
      "Designed a comprehensive gig posting and bidding system with real-time status tracking and notifications",
      "Built an interactive project dashboard with milestone tracking, deliverable management, and deadline monitoring",
      "Implemented role-based access control separating client and freelancer views with granular permissions",
      "Engineered a search and filter system supporting multi-criteria matching across skills, budget, and availability",
    ],
    tech: [
      "React.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "Tailwind CSS",
      "JWT",
    ],
    links: [
      { label: "View Code", href: "https://github.com/TarunMundhra" },
    ],
  },
  {
    title: "StudyFlow",
    emoji: "�",
    description:
      "An offline-first study planning platform enabling uninterrupted usage through local persistence using IndexedDB and background synchronization with conflict-safe schedule syncing.",
    highlights: [
      "Built offline-first architecture using IndexedDB for local persistence with background sync via Service Workers",
      "Implemented conflict-safe schedule syncing with deterministic merge handling",
      "Designed custom scheduling logic supporting subject-wise workload weighting, deadlines, and manual overrides",
      "Ensured seamless transition between online and offline modes without data loss",
    ],
    tech: ["React.js", "IndexedDB", "Service Workers", "Tailwind CSS"],
    links: [
      { label: "View Code", href: "https://github.com/TarunMundhra" },
    ],
  },
  {
    title: "E-Commerce Platform",
    emoji: "🛒",
    description:
      "A scalable video-sharing and e-commerce platform with production-grade backend infrastructure, implementing end-to-end authentication, RESTful APIs, and optimized media delivery with Cloudinary.",
    highlights: [
      "Developed scalable backend with Node.js and Express.js implementing end-to-end JWT authentication including refresh-token handling and role-based access control",
      "Designed RESTful APIs for users, videos, playlists, and subscriptions following MVC architecture with MongoDB aggregation pipelines",
      "Integrated Multer for file handling and Cloudinary for efficient video and thumbnail storage and delivery",
      "Applied pagination, indexing, rate-limiting, and input validation for production-ready stability with structured logging",
    ],
    tech: [
      "Node.js",
      "Express.js",
      "React.js",
      "MongoDB",
      "Cloudinary",
      "JWT",
      "Multer",
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
