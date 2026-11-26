import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { getGuestWorkspace } from "@/lib/firebase/guest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const updateSchema = z.object({ monitoring_enabled: z.boolean() });

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const workspace = await getGuestWorkspace();
  if (!isFirebaseConfigured()) return NextResponse.json({ error: "Cloud storage is not configured." }, { status: 503 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid update request." }, { status: 400 });
  const ref = getAdminDb().collection("monitored_sites").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.workspace_id !== workspace.workspaceId) return NextResponse.json({ error: "Website not found in this workspace." }, { status: 404 });
  await ref.update({ monitoring_enabled: parsed.data.monitoring_enabled });
  return NextResponse.json({ updated: true });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const workspace = await getGuestWorkspace();
  if (!isFirebaseConfigured()) return NextResponse.json({ error: "Cloud storage is not configured." }, { status: 503 });
  const ref = getAdminDb().collection("monitored_sites").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.workspace_id !== workspace.workspaceId) return NextResponse.json({ error: "Website not found in this workspace." }, { status: 404 });
  await ref.delete();
  return NextResponse.json({ deleted: true });
}
