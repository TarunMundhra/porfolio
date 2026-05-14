"use client";

import { Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[#9ca3af] text-sm">
          &copy; 2026 Tarun Mundhra. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="mailto:lthamundhra5@gmail.com"
            className="text-[#9ca3af] hover:text-[#11998e] transition-colors"
            aria-label="Email"
          >
            <Mail size={18} />
          </a>
          <a
            href="https://github.com/TarunMundhra"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9ca3af] hover:text-[#11998e] transition-colors"
            aria-label="GitHub"
          >
            <Github size={18} />
          </a>
          <a
            href="https://linkedin.com/in/tarun-mundhra-0a0a5629a"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9ca3af] hover:text-[#11998e] transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
