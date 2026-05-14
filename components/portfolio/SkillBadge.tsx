"use client";

interface SkillBadgeProps {
  name: string;
}

export default function SkillBadge({ name }: SkillBadgeProps) {
  return (
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-[#e5e7eb] transition-all duration-200 hover:bg-[#11998e]/20 hover:border-[#11998e]/40 hover:text-white hover:-translate-y-0.5 cursor-default">
      {name}
    </span>
  );
}
