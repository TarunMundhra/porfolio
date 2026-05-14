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
  title: "Tarun Mundhra | Portfolio",
  description:
    "Building high-performance trading systems, scalable backend architectures, and cross-platform applications. IIT Kharagpur | Exploration Geophysics.",
  keywords: [
    "Tarun Mundhra",
    "Portfolio",
    "IIT Kharagpur",
    "Trading Systems",
    "Full-Stack Developer",
    "Backend Engineering",
  ],
  authors: [{ name: "Tarun Mundhra" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Tarun Mundhra | Portfolio",
    description:
      "Building high-performance trading systems, scalable backend architectures, and cross-platform applications.",
    siteName: "Tarun Mundhra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarun Mundhra | Portfolio",
    description:
      "Building high-performance trading systems, scalable backend architectures, and cross-platform applications.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
