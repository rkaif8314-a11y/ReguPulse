import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDb } from "@/lib/firebase/admin";
import type { MonitoredSiteDoc } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function VerifyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snap = await getAdminDb().collection("monitored_sites").where("slug", "==", slug).limit(1).get();
  const siteDoc = snap.docs[0];
  if (!siteDoc) notFound();
  const site = { id: siteDoc.id, ...(siteDoc.data() as Omit<MonitoredSiteDoc, "id">) };
  return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-xl px-4 py-14 sm:px-6"><Card className="p-2"><CardHeader className="text-center"><p className="font-mono text-[11px] uppercase tracking-wider text-stone-500">Public website review status</p><div className="mt-2 flex justify-center"><Badge variant={site.badge_verified ? "default" : "moderate"}>{site.badge_verified ? "Latest review above 70" : "Review needs attention"}</Badge></div><CardTitle className="mt-3 text-3xl font-medium text-slate-900" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>{site.domain}</CardTitle></CardHeader><CardContent className="space-y-6 text-center"><p className="text-sm leading-6 text-stone-600">This page confirms that ReguPulse has a saved automated review for this website. It is not a legal certificate or guarantee of compliance.</p><div className="grid grid-cols-2 gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4 text-left"><div><p className="font-mono text-[10px] uppercase text-stone-500">Latest score</p><p className="mt-1 text-2xl font-bold text-emerald-800">{site.last_score ?? "N/A"} / 100</p></div><div><p className="font-mono text-[10px] uppercase text-stone-500">Last reviewed</p><p className="mt-1 text-sm font-medium text-slate-900">{formatDate(site.last_scanned_at)}</p></div></div><div className="flex items-center justify-center gap-1 text-xs text-stone-600"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-700"/> Accessibility, privacy, security and general site quality</div><div className="flex justify-center gap-2"><a href={site.url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Visit {site.domain}<ExternalLink className="ml-1.5 h-3.5 w-3.5"/></Button></a><Link href="/#scanner"><Button size="sm">Review your website</Button></Link></div></CardContent></Card></main></div>;
}
