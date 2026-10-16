"use client";

import Navbar from "@/components/portfolio/Navbar";
import HeroSection from "@/components/portfolio/HeroSection";
import PageTransition from "@/components/portfolio/PageTransition";
import Footer from "@/components/portfolio/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-[#e5e7eb]">
      {/* Ambient background: base gradient + soft brand glows + fading grid */}
      <div className="fixed inset-0 -z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0a1a18_0%,#020617_50%)]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full bg-[#11998e]/15 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[440px] w-[440px] rounded-full bg-[#22c55e]/10 blur-[130px]" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 pt-24">
        <HeroSection />
        <div id="dynamic-content-section">
          <PageTransition />
        </div>
      </main>

      <Footer />
    </div>
  );
}
