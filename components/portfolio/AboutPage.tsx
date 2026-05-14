"use client";

import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import GlassCard from "./GlassCard";
import SkillBadge from "./SkillBadge";
import {
  GraduationCap,
  MapPin,
  Trophy,
  Award,
  BookOpen,
  Code,
} from "lucide-react";

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const skills = {
  Languages: [
    "JavaScript",
    "Python",
    "C++",
    "C",
    "Go",
    "HTML",
    "CSS",
    "SQL",
  ],
  "Frameworks & Libraries": [
    "Node.js",
    "Express.js",
    "React.js",
    "Next.js",
    "React Native (Expo)",
    "Tailwind CSS",
    "NativeWind",
    "TanStack Query",
  ],
  Databases: [
    "MongoDB",
    "PostgreSQL",
    "Redis",
    "IndexedDB",
    "MySQL",
  ],
  "Tools & Technologies": [
    "Git",
    "GitHub",
    "RESTful APIs",
    "Postman",
    "AWS Lambda",
    "Cloudinary",
    "JWT",
    "Docker",
    "WebSockets",
    "Service Workers",
  ],
};

const achievements = [
  {
    icon: <Trophy size={18} />,
    title: "JEE Main 2023",
    description: "Secured Top 1% among 1.2M candidates",
  },
  {
    icon: <Award size={18} />,
    title: "JEE Advanced 2023",
    description: "Secured Top 6% among 200K candidates",
  },
  {
    icon: <BookOpen size={18} />,
    title: "NCC 'B' Certificate",
    description:
      "Certified training camp involving drills and leadership development",
  },
  {
    icon: <Trophy size={18} />,
    title: "Illumination Competition 2025",
    description: "1st position among 25 halls at IIT Kharagpur",
  },
];

const coursework = [
  "Linear Algebra",
  "Probability & Statistics",
  "Programming & Data Structures",
  "Advanced Calculus",
  "Pattern Recognition",
  "Partial Differential Equations",
  "Economics",
  "Project Engineering & Management",
];

export default function AboutPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto px-6 pb-20"
    >
      {/* Education */}
      <motion.div variants={fadeInUp}>
        <SectionHeading title="Education" subtitle="Academic background" />
        <GlassCard className="p-6 md:p-8" hover={false}>
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#11998e]/10 border border-[#11998e]/20 flex items-center justify-center">
              <GraduationCap size={22} className="text-[#11998e]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                Indian Institute of Technology, Kharagpur
              </h3>
              <p className="text-[#9ca3af] text-sm flex items-center gap-1.5 mt-1">
                <MapPin size={13} />
                Kharagpur, India
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-[#22c55e]/10 text-[#22c55e] text-sm font-medium">
                  B.S.(Hons.) Exploration Geophysics
                </span>
                <span className="text-[#9ca3af] text-sm">
                  CGPA:{" "}
                  <span className="text-white font-semibold">8.13/10</span>
                </span>
                <span className="text-[#9ca3af] text-sm">
                  Aug 2023 &ndash; May 2027
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Coursework */}
      <motion.div variants={fadeInUp} className="mt-10">
        <SectionHeading
          title="Coursework"
          subtitle="Relevant academic courses"
        />
        <GlassCard className="p-6" hover={false}>
          <div className="flex flex-wrap gap-2">
            {coursework.map((course) => (
              <SkillBadge key={course} name={course} />
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Skills */}
      <motion.div variants={fadeInUp} className="mt-10">
        <SectionHeading
          title="Technical Skills"
          subtitle="Technologies and tools I work with"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(skills).map(([category, items]) => (
            <GlassCard key={category} className="p-5">
              <h3 className="text-sm font-semibold text-[#11998e] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Code size={14} />
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <SkillBadge key={skill} name={skill} />
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={fadeInUp} className="mt-10">
        <SectionHeading
          title="Achievements"
          subtitle="Highlights and accomplishments"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements.map((item) => (
            <GlassCard key={item.title} className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e]">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-[#9ca3af] text-sm mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
