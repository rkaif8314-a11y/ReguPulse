import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { getGuestWorkspace } from "@/lib/firebase/guest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await context.params;
  const workspace = await getGuestWorkspace();
  if (!isFirebaseConfigured()) return NextResponse.json({ error: "Local reports are stored in this browser." }, { status: 404 });
  const snap = await getAdminDb().collection("scans").doc(scanId).get();
  if (!snap.exists || snap.data()?.workspace_id !== workspace.workspaceId) {
    return NextResponse.json({ error: "Report not found in this workspace." }, { status: 404 });
  }
  return NextResponse.json({ scan: { id: snap.id, ...snap.data() } }, { headers: { "Cache-Control": "no-store" } });
}
