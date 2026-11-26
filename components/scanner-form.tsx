"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Globe, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScanResult } from "@/lib/types";

const SCAN_STEPS = [
  "Validating the address and public network destination",
  "Reviewing accessibility and page structure",
  "Checking privacy, trackers, cookies and security headers",
  "Assessing metadata, page identity and general site quality",
  "Preparing detailed findings and verification steps",
];
const LOCAL_CREDITS_KEY = "regupulse.local.credits.v1";
const LOCAL_REPORTS_KEY = "regupulse.local.reports.v1";

export function ScannerForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [cloud, setCloud] = useState(false);

  useEffect(() => {
    fetch("/api/workspace", { cache: "no-store" }).then((r) => r.json()).then((data) => {
      if (data.mode === "cloud") { setCloud(true); setCredits(Number(data.creditsRemaining ?? 0)); }
      else {
        const saved = localStorage.getItem(LOCAL_CREDITS_KEY);
        const initial = saved === null ? 50 : Math.max(0, Number(saved) || 0);
        if (saved === null) localStorage.setItem(LOCAL_CREDITS_KEY, String(initial));
        setCredits(initial);
      }
    }).catch(() => setCredits(50));
  }, []);

  useEffect(() => {
    if (!isScanning) { setStepIndex(0); return; }
    const timer = setInterval(() => setStepIndex((prev) => Math.min(prev + 1, SCAN_STEPS.length - 1)), 1900);
    return () => clearInterval(timer);
  }, [isScanning]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    if (!url.trim()) { setError("Enter a website URL, for example https://example.com."); return; }
    if (credits !== null && credits < 1 && !cloud) { setError("You have no local preview credits left. Choose a plan to continue."); return; }
    setIsScanning(true);
    try {
      const response = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      const data = await response.json();
      if (!response.ok || !data.scanId) throw new Error(data.error || "The website review failed.");
      if (data.mode === "cloud") {
        setCredits(Number(data.creditsRemaining ?? 0));
      } else {
        const current = Number(localStorage.getItem(LOCAL_CREDITS_KEY) ?? 50);
        const nextCredits = Math.max(0, current - 1);
        localStorage.setItem(LOCAL_CREDITS_KEY, String(nextCredits));
        setCredits(nextCredits);
        const report = { id: data.scanId, ...data.result };
        const existing = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || "[]") as Array<{ id: string }>;
        localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify([report, ...existing.filter((item) => item.id !== data.scanId)].slice(0, 30)));
      }
      router.push(`/report/${data.scanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review the website.");
      setIsScanning(false);
    }
  }

  return <div id="scanner" className="w-full max-w-3xl">
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl border border-stone-300 bg-white p-2 shadow-sm sm:flex-row">
      <div className="relative flex-1"><Globe className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" /><Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourcompany.com" disabled={isScanning} required aria-label="Website URL to review" className="border-0 pl-9 font-mono text-sm focus-visible:ring-0" /></div>
      <Button type="submit" disabled={isScanning || (credits !== null && credits < 1 && !cloud)}>{isScanning ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Reviewing…</> : <>Run full review <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></>}</Button>
    </form>
    <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-stone-500"><span>HTTPS websites only · 30 checks · 1 credit per scan</span><span>{credits === null ? "Loading credits…" : `${credits} credits remaining`}{cloud ? " · cloud workspace" : " · browser preview"}</span></div>
    {isScanning && <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-left"><p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-stone-500">Review progress</p><div className="space-y-2">{SCAN_STEPS.map((label, idx) => <div key={label} className={`flex items-center gap-2.5 text-xs ${idx < stepIndex ? "text-emerald-700" : idx === stepIndex ? "font-semibold text-slate-900" : "text-stone-400"}`}>{idx < stepIndex ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : idx === stepIndex ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-stone-300" />}<span>{label}</span></div>)}</div></div>}
    {error && <div role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"><ShieldAlert className="h-4 w-4 shrink-0" /><span>{error}</span></div>}
  </div>;
}
