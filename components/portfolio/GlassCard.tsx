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
      className={`relative group bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden ${
        hover
          ? "transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-[#7c3aed]/40 hover:shadow-[0_8px_40px_rgba(124,58,237,0.15)]"
          : ""
      } ${className}`}
    >
      {/* Gradient overlay on hover */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/0 via-[#7c3aed]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
