import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { scanWebsite } from "@/lib/scanner/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isFirebaseConfigured()) return NextResponse.json({ error: "Firebase Firestore is not configured." }, { status: 503 });
  const db = getAdminDb();
  const sites = await db.collection("monitored_sites").where("monitoring_enabled", "==", true).get();
  const results: Array<{ domain: string; score: number; regression: boolean; reportId: string }> = [];
  for (const siteDoc of sites.docs) {
    const site = siteDoc.data();
    try {
      const result = await scanWebsite(String(site.url));
      const previousScore = Number(site.last_score ?? 100);
      const reportRef = db.collection("scans").doc();
      await reportRef.set({ ...result, workspace_id: site.workspace_id, site_id: siteDoc.id, created_at: new Date().toISOString() });
      await siteDoc.ref.update({ last_score: result.overall_score, last_scanned_at: new Date().toISOString(), badge_verified: result.overall_score >= 70 });
      results.push({ domain: String(site.domain), score: result.overall_score, regression: result.overall_score < previousScore, reportId: reportRef.id });
    } catch (error) {
      results.push({ domain: String(site.domain), score: Number(site.last_score ?? 0), regression: false, reportId: "" });
      console.error("Weekly review failed for", site.domain, error);
    }
  }
  return NextResponse.json({ audited: results.filter((item) => item.reportId).length, results });
}
