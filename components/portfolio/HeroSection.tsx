"use client";

import { motion } from "framer-motion";
import { useNavStore } from "@/store/useNavStore";
import { FileDown, ChevronDown } from "lucide-react";

export default function HeroSection() {
  const { setCurrentPage } = useNavStore();

  return (
    <section className="text-center pt-20 pb-8 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.p
          className="text-[#9ca3af] text-sm md:text-base tracking-wide uppercase mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Portfolio
        </motion.p>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
          <span className="bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#22c55e] bg-clip-text text-transparent">
            Tarun Mundhra
          </span>
        </h1>

        <motion.p
          className="text-[#9ca3af] text-base md:text-lg mt-4 max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Building high-performance trading systems, scalable backend
          architectures, and cross-platform applications.
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <button
            onClick={() => setCurrentPage("projects")}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#7c3aed] text-white text-sm font-medium transition-all hover:bg-[#6d28d9] hover:shadow-lg hover:shadow-[#7c3aed]/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            View Projects
          </button>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-white/10 text-[#e5e7eb] text-sm font-medium transition-all hover:bg-white/5 hover:border-[#7c3aed]/50 hover:-translate-y-0.5 active:translate-y-0"
          >
            <FileDown size={16} />
            Resume
          </a>
        </motion.div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <ChevronDown
            size={20}
            className="mx-auto text-[#9ca3af] animate-bounce"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
