"use client";

import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import GlassCard from "./GlassCard";
import {
  Mail,
  Phone,
  Github,
  Linkedin,
  MapPin,
  Send,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

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

const contactInfo = [
  {
    icon: <Mail size={18} />,
    label: "Email",
    value: "lthamundhra5@gmail.com",
    href: "https://mail.google.com/mail/?view=cm&fs=1&to=lthamundhra5@gmail.com&su=Portfolio%20Contact",
    copyable: true,
  },
  {
    icon: <Phone size={18} />,
    label: "Phone",
    value: "+91 9348896824",
    href: "tel:+919348896824",
    copyable: false,
  },
  {
    icon: <Github size={18} />,
    label: "GitHub",
    value: "github.com/TarunMundhra",
    href: "https://github.com/TarunMundhra",
    copyable: false,
  },
  {
    icon: <Linkedin size={18} />,
    label: "LinkedIn",
    value: "linkedin.com/in/tarun-mundhra-0a0a5629a",
    href: "https://linkedin.com/in/tarun-mundhra-0a0a5629a",
    copyable: false,
  },
  {
    icon: <MapPin size={18} />,
    label: "Location",
    value: "IIT Kharagpur, West Bengal, India",
    href: null,
    copyable: false,
  },
];

export default function ContactPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto px-6 pb-20"
    >
      <motion.div variants={fadeInUp}>
        <SectionHeading
          title="Contact"
          subtitle="Let's connect and build something great"
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Contact Cards */}
        <motion.div
          variants={fadeInUp}
          className="md:col-span-3 space-y-4"
        >
          {contactInfo.map((item) => (
            <GlassCard key={item.label} className="p-5" hover={true}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#11998e]/10 border border-[#11998e]/20 flex items-center justify-center text-[#11998e] flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-[#9ca3af] uppercase tracking-wider font-medium">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={
                          item.href.startsWith("http")
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          item.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="text-sm text-white hover:text-[#11998e] transition-colors font-medium"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm text-white font-medium">
                        {item.value}
                      </p>
                    )}
                  </div>
                </div>
                {item.copyable && (
                  <button
                    onClick={() => handleCopy(item.value, item.label)}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#9ca3af] hover:text-[#11998e] hover:border-[#11998e]/40 transition-all"
                    aria-label={`Copy ${item.label}`}
                  >
                    {copied === item.label ? (
                      <Check size={14} className="text-[#22c55e]" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
        </motion.div>

        {/* Quick Message Card */}
        <motion.div variants={fadeInUp} className="md:col-span-2">
          <GlassCard className="p-6 h-full flex flex-col" hover={false}>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Send size={16} className="text-[#11998e]" />
              Get in Touch
            </h3>
            <p className="text-[#9ca3af] text-sm leading-relaxed mb-6">
              I&apos;m always open to discussing new projects, creative ideas,
              or opportunities to be part of your vision. Feel free to reach
              out through any of the channels!
            </p>

            <div className="mt-auto space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#085d56]/10 to-[#22c55e]/5 border border-[#11998e]/10">
                <p className="text-xs text-[#9ca3af] uppercase tracking-wider font-medium mb-1">
                  Response Time
                </p>
                <p className="text-sm text-white">
                  Usually within 24 hours
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <p className="text-xs text-[#9ca3af] uppercase tracking-wider font-medium mb-1">
                  Current Focus
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Full-Stack",
                    "Backend",
                    "DevOps",
                    "AI",
                    "React Native",
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-[#e5e7eb]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=lthamundhra5@gmail.com&su=Portfolio%20Contact"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-[#085d56] to-[#00998c] text-white text-sm font-medium transition-all hover:from-[#074f49] hover:to-[#007a70] hover:shadow-lg hover:shadow-[#11998e]/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Mail size={16} />
                Send Email
              </a>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
