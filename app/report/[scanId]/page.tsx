"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ReportClient } from "@/components/report-client";
import type { ScanResult } from "@/lib/types";

type Report = ScanResult & { id: string };
const LOCAL_REPORTS_KEY = "regupulse.local.reports.v1";

export default function ReportPage() {
  const params = useParams<{ scanId: string }>();
  const scanId = params.scanId;
  const [scan, setScan] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/reports/${encodeURIComponent(scanId)}`, { cache: "no-store" }).then(async (response) => {
      if (response.ok) return response.json();
      const local = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || "[]") as Report[];
      const match = local.find((item) => item.id === scanId);
      if (match) return { scan: match };
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "This report is not available in the current workspace.");
    }).then((data) => { if (active) setScan(data.scan as Report); }).catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not load this report."); });
    return () => { active = false; };
  }, [scanId]);

  return <div className="min-h-screen"><Navbar />{scan ? <ReportClient scan={scan} /> : <div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-2xl text-slate-900" style={{fontFamily:"var(--font-serif), Georgia, serif"}}>{error ? "Report unavailable" : "Preparing your detailed report…"}</h1><p className="mt-3 text-xs text-stone-500">{error || "Loading findings and verification steps."}</p></div>}</div>;
}
