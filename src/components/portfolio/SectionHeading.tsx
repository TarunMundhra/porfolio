"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export default function SectionHeading({
  title,
  subtitle,
}: SectionHeadingProps) {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
        <span className="w-1 h-8 bg-gradient-to-b from-[#11998e] to-[#22c55e] rounded-full" />
        <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          {title}
        </span>
      </h2>
      {subtitle && (
        <p className="text-[#9ca3af] mt-2 ml-4 text-sm md:text-base">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
