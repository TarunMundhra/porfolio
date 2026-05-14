"use client";

import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  hover = true,
}: GlassCardProps) {
  return (
    <div
      className={`relative group rounded-2xl border overflow-hidden
        bg-white/[0.04] backdrop-blur-md
        border-white/[0.08]
        ${hover
          ? `transition-all duration-300 
             hover:-translate-y-1 hover:scale-[1.01]
             hover:border-[#11998e]/40
             hover:bg-white/[0.07]
             hover:shadow-[0_8px_40px_rgba(17,153,142,0.15)]`
          : ""
        } ${className}`}
    >
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-br 
          from-[#11998e]/0 via-[#11998e]/[0.05] to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity 
          duration-500 pointer-events-none" />
      )}
      {/* Top edge highlight — signature glassmorphism detail */}
      <div className="absolute inset-x-0 top-0 h-px 
        bg-gradient-to-r from-transparent via-[#11998e]/40 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
