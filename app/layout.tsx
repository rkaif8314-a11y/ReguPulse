import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "ReguPulse — Website quality, privacy and accessibility reviews",
  description: "Detailed website reviews for accessibility, privacy, security, SEO and general site quality, with practical evidence and fix guidance.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://regupulse.vercel.app"),
  openGraph: { title: "ReguPulse — Website reviews made actionable", description: "Inspect a public website, understand the findings and work through the fixes.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en" className={`${inter.variable} ${newsreader.variable} ${mono.variable}`}><body className={`${inter.className} min-h-screen antialiased`}>{children}</body></html>;
}
