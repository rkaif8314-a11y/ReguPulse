import { NextResponse } from "next/server";
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { getGuestWorkspace } from "@/lib/firebase/guest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getGuestWorkspace();
  if (!isFirebaseConfigured()) return NextResponse.json({ mode: "local", scans: [] });
  const snap = await getAdminDb().collection("scans")
    .where("workspace_id", "==", context.workspaceId)
    .orderBy("created_at", "desc").limit(30).get();
  const scans = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ mode: "cloud", scans }, { headers: { "Cache-Control": "no-store" } });
}
