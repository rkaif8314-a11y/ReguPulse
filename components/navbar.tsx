import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-stone-200 bg-[#F7F7F5]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-white"><ShieldCheck className="h-4 w-4" /></div>
          <span className="text-sm font-semibold tracking-tight text-slate-900">ReguPulse</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/#coverage" className="hidden text-xs font-medium text-stone-600 hover:text-slate-900 sm:inline-block">Coverage</Link>
          <Link href="/pricing" className="text-xs font-medium text-stone-600 hover:text-slate-900">Pricing</Link>
          <Link href="/dashboard"><Button size="sm" variant="outline">Workspace</Button></Link>
          <Link href="/#scanner"><Button size="sm">Run check</Button></Link>
        </nav>
      </div>
    </header>
  );
}
