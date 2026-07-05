import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tarun Mundhra | Full-Stack Developer & Software Engineer",
  description:
    "Portfolio of Tarun Mundhra, a Full-Stack Developer and Software Engineer at IIT Kharagpur specializing in trading systems, scalable backend architectures, and cross-platform applications.",
  keywords: [
    "Tarun Mundhra",
    "Portfolio",
    "IIT Kharagpur",
    "Trading Systems",
    "Full-Stack Developer",
    "Backend Engineering",
    "Software Engineer",
  ],
  authors: [{ name: "Tarun Mundhra" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Tarun Mundhra | Full-Stack Developer & Software Engineer",
    description:
      "Portfolio of Tarun Mundhra, a Full-Stack Developer and Software Engineer at IIT Kharagpur specializing in trading systems, scalable backend architectures, and cross-platform applications.",
    siteName: "Tarun Mundhra",
    type: "website",
    url: "https://tarun-mundhra.netlify.app/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarun Mundhra | Full-Stack Developer & Software Engineer",
    description:
      "Portfolio of Tarun Mundhra, a Full-Stack Developer and Software Engineer at IIT Kharagpur specializing in trading systems, scalable backend architectures, and cross-platform applications.",
  },
  verification: {
    google: "P2QNcU64ZI-7K9baFXnsSnFpaSASYoX4Tkgm_jA-hZU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Tarun Mundhra",
    url: "https://tarun-mundhra.netlify.app/",
    jobTitle: "Full-Stack Developer",
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "IIT Kharagpur",
    },
    sameAs: [
      "https://github.com/TarunMundhra",
      "https://linkedin.com/in/tarun-mundhra-0a0a5629a",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
