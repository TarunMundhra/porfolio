import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
