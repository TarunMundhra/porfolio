import type { Metadata } from "next";
import "./globals.css";

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
  metadataBase: new URL("https://tarunmundhra.tech"),
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Tarun Mundhra | Full-Stack Developer & Software Engineer",
    description:
      "Portfolio of Tarun Mundhra, a Full-Stack Developer and Software Engineer at IIT Kharagpur specializing in trading systems, scalable backend architectures, and cross-platform applications.",
    siteName: "Tarun Mundhra",
    type: "website",
    url: "https://tarunmundhra.tech/",
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
    url: "https://tarunmundhra.tech/",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Geist+Mono:wght@100..900&display=swap"
        />
      </head>
      <body
        className="font-sans antialiased bg-background text-foreground"
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
