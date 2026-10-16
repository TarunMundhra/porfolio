"use client";

import { motion } from "framer-motion";
import { useNavStore } from "@/store/useNavStore";
import { FileDown, ChevronDown } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
  const { setCurrentPage } = useNavStore();

  return (
    <section className="text-center pt-20 pb-8 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs sm:text-sm text-[#cbd5e1]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#22c55e]/70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
            </span>
            Open to internships &amp; new projects
          </span>
        </motion.div>

        <div className="flex justify-center mb-6">
          <div className="p-1.5 rounded-full bg-gradient-to-br from-[#085d56] via-[#11998e] to-[#22c55e] shadow-[0_12px_40px_rgba(17,153,142,0.25)]">
            <div className="rounded-full bg-[#020617] p-1">
              <Image
                src="/Tarun.jpeg"
                alt="Tarun Mundhra - Full-Stack Developer"
                width={128}
                height={128}
                className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover"
                priority
              />
            </div>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white">
          Tarun Mundhra
        </h1>

        <motion.h2
          className="text-[#9ca3af] text-base md:text-lg mt-4 max-w-xl mx-auto leading-relaxed font-normal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Building high-performance trading systems, scalable backend
          architectures, and cross-platform applications as a Full-Stack Developer.
        </motion.h2>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <button
            onClick={() => setCurrentPage("projects")}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-[#085d56] to-[#00998c] text-white text-sm font-medium transition-all hover:from-[#074f49] hover:to-[#007a70] hover:shadow-lg hover:shadow-[#11998e]/30 hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden"
          >
            View Projects
          </button>
          <a
            href="/Tarun-Mundhra-Resume.pdf"
            download="Tarun-Mundhra-Resume.pdf"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#11998e]/40 text-[#e5e7eb] text-sm font-medium transition-all hover:bg-[#11998e]/10 hover:border-[#11998e]/70 hover:-translate-y-0.5 active:translate-y-0"
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
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={20} className="mx-auto text-[#9ca3af]" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
