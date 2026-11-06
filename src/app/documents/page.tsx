import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Download, ExternalLink, ArrowLeft, Award, CheckCircle2, ShieldCheck, Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Documents & Credentials | Tarun Mundhra",
  description: "Official resume, internship completion letters, and experience certificates for Tarun Mundhra.",
};

const documents = [
  {
    id: "resume",
    title: "Latest Curriculum Vitae (CV)",
    category: "Resume & Profile",
    issuer: "IIT Kharagpur",
    period: "Updated 2026",
    badge: "Current CV",
    description:
      "Tarun Mundhra's latest 1-page CV featuring education at IIT Kharagpur (Exploration Geophysics), Software Development Internships at Quick Dry Cleaning Software & AMRR TechSols, Founding Engineer at JuryAssist, and key engineering projects.",
    fileUrl: "/Tarun-Mundhra-Resume.pdf",
    fileName: "Tarun-Mundhra-Resume.pdf",
    shortUrl: "https://tarunmundhra.tech/cv",
    icon: FileText,
    accentColor: "#11998e",
  },
  {
    id: "dc-web-services",
    title: "Internship Completion & Settlement Letter",
    category: "Internship Certificate",
    issuer: "DC Web Services Pvt. Ltd. (Quick Dry Cleaning Software)",
    period: "18th May 2026 – 10th Sep 2026",
    badge: "Verified Completion",
    description:
      "Official certificate of internship completion as a Software Development Engineering Intern at DC Web Services Pvt. Ltd. / Quick Dry Cleaning Software, including full and final settlement clearance.",
    fileUrl: "/quick-dry-cleaning-internship.pdf",
    fileName: "DC-Web-Services-Quick-Dry-Cleaning-Internship.pdf",
    shortUrl: "https://tarunmundhra.tech/quick-dry-cleaning",
    icon: Award,
    accentColor: "#22c55e",
  },
  {
    id: "amrr-techsols",
    title: "Certificate of Continuing Internship",
    category: "Internship Certificate",
    issuer: "AMRR TechSols Pvt. Ltd.",
    period: "1st May 2026 – 31st October 2026",
    badge: "Verified Internship",
    description:
      "Official certificate of internship issued by CEO Archimedha Mohapatra for contributions as a Software Development Intern working on legal-tech platforms, AI risk engine, and RAG pipelines.",
    fileUrl: "/amrr-techsols-internship.pdf",
    fileName: "AMRR-TechSols-Internship-Certificate.pdf",
    shortUrl: "https://tarunmundhra.tech/amrr",
    icon: Award,
    accentColor: "#3b82f6",
  },
];

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-[#e5e7eb] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 -z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0a1a18_0%,#020617_50%)]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[750px] rounded-full bg-[#11998e]/15 blur-[120px]" />
        <div className="absolute bottom-10 right-10 h-[360px] w-[360px] rounded-full bg-[#22c55e]/10 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[#9ca3af] hover:text-white hover:border-[#11998e]/40 transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Portfolio
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#11998e]/10 border border-[#11998e]/30 text-xs sm:text-sm text-[#22c55e] mb-4">
            <ShieldCheck size={16} />
            Verified Credentials &amp; Documents
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Official Documents &amp; Certificates
          </h1>
          <p className="text-[#9ca3af] max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Direct access to verified internship certificates, completion letters, and the latest CV for Tarun Mundhra.
          </p>
        </div>

        {/* Documents Grid */}
        <div className="space-y-6">
          {documents.map((doc) => {
            const IconComponent = doc.icon;
            return (
              <div
                key={doc.id}
                className="relative rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] hover:border-[#11998e]/40 p-6 sm:p-8 transition-all hover:bg-white/[0.06] hover:shadow-[0_10px_44px_rgba(17,153,142,0.15)] group"
              >
                {/* Top highlight bar */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#11998e]/40 to-transparent" />

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-[#cbd5e1] border border-white/[0.08]">
                        {doc.category}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={12} />
                        {doc.badge}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-[#2dd4bf] transition-colors">
                      {doc.title}
                    </h2>

                    <div className="flex items-center gap-2 text-sm text-[#11998e] font-medium mb-3">
                      <Briefcase size={15} />
                      <span>{doc.issuer}</span>
                      <span className="text-white/30">•</span>
                      <span className="text-[#9ca3af]">{doc.period}</span>
                    </div>

                    <p className="text-sm text-[#9ca3af] leading-relaxed mb-4">
                      {doc.description}
                    </p>

                    <div className="inline-flex items-center gap-2 text-xs text-[#64748b] bg-white/[0.02] px-3 py-1 rounded-md border border-white/[0.04]">
                      <span>Direct URL:</span>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#38bdf8] hover:underline"
                      >
                        {doc.shortUrl}
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-row md:flex-col gap-3 min-w-[170px] justify-center">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#085d56] to-[#00998c] hover:from-[#074f49] hover:to-[#007a70] text-white text-sm font-medium transition-all shadow-md hover:shadow-[#11998e]/20"
                    >
                      <ExternalLink size={16} />
                      View Document
                    </a>
                    <a
                      href={doc.fileUrl}
                      download={doc.fileName}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.12] hover:border-[#11998e]/60 hover:bg-[#11998e]/10 text-[#e5e7eb] text-sm font-medium transition-all"
                    >
                      <Download size={16} />
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 text-xs text-[#64748b]">
          Hosted on <span className="text-[#9ca3af]">tarunmundhra.tech</span> • For verification requests, contact{" "}
          <a href="mailto:lthamundhra5@gmail.com" className="text-[#11998e] hover:underline">
            lthamundhra5@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
