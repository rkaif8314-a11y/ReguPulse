import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { consumeCredits, getGuestWorkspace, refundCredits, SCAN_CREDIT_COST } from "@/lib/firebase/guest";
import { scanWebsite } from "@/lib/scanner/engine";
import { SSRFError } from "@/lib/scanner/ssrf-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scanRequestSchema = z.object({ url: z.string().min(3, "Enter a valid website URL.").max(500) });

export async function POST(request: NextRequest) {
  const context = await getGuestWorkspace();
  let charged = false;
  try {
    const body = await request.json();
    const parsed = scanRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });

    if (context.cloud) {
      const charge = await consumeCredits(context.workspaceId, SCAN_CREDIT_COST);
      if (!charge.ok) return NextResponse.json({ error: "You have used all available scan credits. Choose a plan to continue." }, { status: 402 });
      charged = true;
    }

    const result = await scanWebsite(parsed.data.url);
    if (context.cloud && isFirebaseConfigured()) {
      const db = getAdminDb();
      const scanRef = db.collection("scans").doc();
      await scanRef.set({ ...result, workspace_id: context.workspaceId, site_id: null });
      const updatedWorkspace = await db.collection("guest_workspaces").doc(context.workspaceId).get();
      charged = false;
      return NextResponse.json({ scanId: scanRef.id, result, mode: "cloud", creditsRemaining: updatedWorkspace.data()?.credits_remaining ?? 0 }, { status: 201 });
    }

    return NextResponse.json({ scanId: randomUUID(), result, mode: "local" }, { status: 201 });
  } catch (error) {
    if (charged) {
      try { await refundCredits(context.workspaceId, SCAN_CREDIT_COST); } catch { /* Keep the original scan error. */ }
    }
    if (error instanceof SSRFError) return NextResponse.json({ error: error.message }, { status: 400 });
    const message = error instanceof Error ? error.message : "The website could not be scanned.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
