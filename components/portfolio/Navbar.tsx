"use client";

import { useNavStore, type Page } from "@/store/useNavStore";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems: { label: string; page: Page }[] = [
  { label: "About", page: "about" },
  { label: "Projects", page: "projects" },
  { label: "Experience", page: "experience" },
  { label: "Contact", page: "contact" },
];

export default function Navbar() {
  const { currentPage, setCurrentPage } = useNavStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#020617]/80 border-b border-white/5">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => setCurrentPage("about")}
          className="text-lg font-bold bg-gradient-to-r from-[#7c3aed] to-[#22c55e] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          TM
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className="relative px-4 py-2 text-sm font-medium transition-colors"
            >
              <span
                className={
                  currentPage === item.page
                    ? "text-white"
                    : "text-[#9ca3af] hover:text-white"
                }
              >
                {item.label}
              </span>
              {currentPage === item.page && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-[#7c3aed] to-[#22c55e] rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-[#9ca3af] hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden border-t border-white/5 bg-[#020617]/95 backdrop-blur-xl"
        >
          <div className="px-6 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  setCurrentPage(item.page);
                  setMobileOpen(false);
                }}
                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  currentPage === item.page
                    ? "text-white bg-white/10 border-l-2 border-[#7c3aed]"
                    : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
