"use client";

import Navbar from "@/components/portfolio/Navbar";
import HeroSection from "@/components/portfolio/HeroSection";
import PageTransition from "@/components/portfolio/PageTransition";
import Footer from "@/components/portfolio/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-[#e5e7eb]">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,#0a1a18_0%,#020617_50%)]" />

      <Navbar />

      <main className="relative z-10 flex-1 pt-24">
        <HeroSection />
        <PageTransition />
      </main>

      <Footer />
    </div>
  );
}
