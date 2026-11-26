import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { getGuestWorkspace } from "@/lib/firebase/guest";
import { PRICING_PLANS } from "@/lib/pricing";
import { assertSafeUrl, SSRFError } from "@/lib/scanner/ssrf-guard";
import type { MonitoredSiteDoc } from "@/lib/types";
import { slugifyDomain } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const addSiteSchema = z.object({ url: z.string().min(3).max(500) });

export async function GET() {
  const workspace = await getGuestWorkspace();
  if (!isFirebaseConfigured()) return NextResponse.json({ sites: [], mode: "local" });
  const snap = await getAdminDb().collection("monitored_sites").where("workspace_id", "==", workspace.workspaceId).orderBy("created_at", "desc").get();
  const sites: MonitoredSiteDoc[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<MonitoredSiteDoc, "id">) }));
  return NextResponse.json({ sites, mode: "cloud" }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await getGuestWorkspace();
    if (!workspace.cloud || !workspace.workspace) return NextResponse.json({ error: "Configure Firebase Firestore to save monitored websites." }, { status: 503 });
    const parsed = addSiteSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid website URL." }, { status: 400 });
    const safeUrl = await assertSafeUrl(parsed.data.url);
    const domain = safeUrl.hostname.replace(/^www\./, "").toLowerCase();
    const db = getAdminDb();
    const existing = await db.collection("monitored_sites").where("workspace_id", "==", workspace.workspaceId).get();
    const allowance = PRICING_PLANS[workspace.workspace.plan_tier].maxMonitoredSites;
    if (existing.size >= allowance) return NextResponse.json({ error: `Your ${workspace.workspace.plan_tier} plan allows ${allowance} monitored website(s). Upgrade to add more.` }, { status: 403 });
    if (existing.docs.some((doc) => doc.data().domain === domain)) return NextResponse.json({ error: `${domain} is already saved in this workspace.` }, { status: 409 });
    const now = new Date().toISOString();
    const ref = db.collection("monitored_sites").doc();
    const payload: Omit<MonitoredSiteDoc, "id"> = {
      workspace_id: workspace.workspaceId, domain, url: safeUrl.toString(),
      slug: `${slugifyDomain(domain)}-${Math.random().toString(36).slice(2, 6)}`,
      monitoring_enabled: true, last_score: null, last_scanned_at: null, badge_verified: false, created_at: now,
    };
    await ref.set(payload);
    return NextResponse.json({ site: { id: ref.id, ...payload } }, { status: 201 });
  } catch (error) {
    if (error instanceof SSRFError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save this website." }, { status: 500 });
  }
}
