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

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setMobileOpen(false);

    setTimeout(() => {
      document.getElementById("dynamic-content-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl">
      {/* Floating pill navbar */}
      <div className="
        flex items-center justify-between
        px-5 h-14
        rounded-2xl
        bg-[#09090a]/80 backdrop-blur-xl
        border border-white/[0.08]
        shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      ">
        {/* Logo */}
        <button
          onClick={() => handleNavClick("about")}
          className="text-base font-bold tracking-tight
            bg-gradient-to-r from-[#11998e] to-[#22c55e] 
            bg-clip-text text-transparent 
            hover:opacity-80 transition-opacity"
        >
          TM
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => handleNavClick(item.page)}
              className={`relative px-4 py-1.5 rounded-lg text-sm font-medium 
                transition-all duration-200
                ${currentPage === item.page
                  ? "text-white bg-[#11998e]/20 border border-[#11998e]/30"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/[0.06]"
                }`}
            >
              {item.label}
              {currentPage === item.page && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -bottom-0.5 left-3 right-3 h-px 
                    bg-gradient-to-r from-[#11998e] to-[#22c55e] rounded-full"
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
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav — drops below the pill */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-2 rounded-2xl bg-[#09090a]/90 backdrop-blur-xl 
            border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium 
                  transition-all
                  ${currentPage === item.page
                    ? "text-white bg-[#11998e]/20 border border-[#11998e]/30"
                    : "text-[#9ca3af] hover:text-white hover:bg-white/[0.06]"
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
