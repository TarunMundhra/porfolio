"use client";

import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import GlassCard from "./GlassCard";
import {
  Calendar,
  Users,
  MonitorSmartphone,
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
    title: "Interhall GC-OpenSoft Competition",
    organization: "MMM Hall of Residence | IIT Kharagpur",
    role: "Vice-Captain",
    period: "2026",
    icon: <Users size={22} />,
    accentColor: "#11998e",
    description:
      "Led a 20-member cross-functional development team to design and deliver a full-stack, institutional-grade algorithmic trading simulator under competitive inter-hall conditions at IIT Kharagpur.",
    highlights: [
      "Led a 20-member cross-functional development team",
      "Delivered a full-stack, institutional-grade algorithmic trading simulator",
      "Executed under competitive inter-hall conditions at IIT Kharagpur",
    ],
    tech: [],
    links: [],
  },
  {
    title: "Hall Technical Committee",
    organization: "MMM Hall of Residence | IIT Kharagpur",
    role: "Committee Member",
    period: "2026",
    icon: <MonitorSmartphone size={22} />,
    accentColor: "#22c55e",
    description: "Hall Technical Committee 2026.",
    highlights: ["Hall Technical Committee 2026"],
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
          title="Positions of Responsibility"
          subtitle="Leadership roles at IIT Kharagpur"
        />
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
