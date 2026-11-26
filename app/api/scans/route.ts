import { NextResponse } from "next/server";
import { databaseSelect } from "@/lib/supabase-admin";
import { getWorkspaceContext } from "@/lib/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const context = await getWorkspaceContext();
  if (!context.cloud) return NextResponse.json({ scans: [], mode: "local" }, { headers: { "Cache-Control": "no-store" } });
  if (!context.workspace) return NextResponse.json({ error: "Workspace storage is unavailable." }, { status: 503 });
  const query = new URLSearchParams({
    select: "id,target_url,score,findings,created_at",
    workspace_id: "eq." + String(context.workspace.id),
    order: "created_at.desc",
    limit: "8"
  });
  const response = await databaseSelect("audit_scans", query.toString());
  if (response.error) return NextResponse.json({ error: "Unable to load review history." }, { status: 503 });
  const scans = response.data.map((row) => ({
    id: String(row.id), host: new URL(String(row.target_url)).hostname, finalUrl: String(row.target_url),
    score: Number(row.score), findings: row.findings, createdAt: String(row.created_at), summary: "Saved review"
  }));
  return NextResponse.json({ scans, mode: "cloud" }, { headers: { "Cache-Control": "no-store" } });
}