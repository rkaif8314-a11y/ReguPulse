import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const context = await getWorkspaceContext();
  if (!context.cloud) return NextResponse.json({ mode: "local" }, { headers: { "Cache-Control": "no-store" } });
  if (!context.workspace) return NextResponse.json({ error: "Cloud credits are not ready. Check the database migration and service key." }, { status: 503 });
  return NextResponse.json({
    mode: "cloud",
    creditsRemaining: Number(context.workspace.credits_remaining ?? 0),
    isFounder: Boolean(context.workspace.is_founder),
    plan: String(context.workspace.subscription_plan ?? "free")
  }, { headers: { "Cache-Control": "no-store" } });
}