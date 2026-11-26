import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReguPulse — Website compliance, made clear",
  description: "Practical website checks for accessibility, privacy transparency, cookies and web security.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://regupulse.vercel.app"),
  openGraph: {
    title: "ReguPulse — Website compliance, made clear",
    description: "Find issues, understand the impact and know what to fix next.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="shell header-inner">
            <Link href="/" className="brand" aria-label="ReguPulse home">
              <span className="brand-mark"><span /></span><span>regupulse</span>
            </Link>
            <nav className="main-nav" aria-label="Main navigation">
              <a href="/#how-it-works">How it works</a><a href="/#coverage">Coverage</a><Link href="/pricing">Pricing</Link>
            </nav>
            <Link href="/#scanner" className="header-cta">Open workspace <span aria-hidden="true">↗</span></Link>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="shell footer-inner">
            <Link href="/" className="brand footer-brand"><span className="brand-mark"><span /></span><span>regupulse</span></Link>
            <p>Clear checks. Better websites. More confident teams.</p>
            <div className="footer-links"><Link href="/pricing">Plans</Link><a href="/prototype.html">Original preview</a></div>
          </div>
          <div className="shell footer-bottom"><span>© {new Date().getFullYear()} ReguPulse</span><span>Screening support only — not legal certification.</span></div>
        </footer>
      </body>
    </html>
  );
}