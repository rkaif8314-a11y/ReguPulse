import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit";
import { fetchPublicHtml } from "@/lib/public-fetch";
import { databaseInsert, databaseRpc } from "@/lib/supabase-admin";
import { getWorkspaceContext } from "@/lib/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 }); }
  const inputUrl = typeof payload === "object" && payload !== null && "url" in payload ? String((payload as { url: unknown }).url).trim() : "";
  if (!inputUrl || inputUrl.length > 2048) return NextResponse.json({ error: "Enter a valid website URL." }, { status: 400 });

  const context = await getWorkspaceContext();
  if (context.cloud && !context.workspace) return NextResponse.json({ error: "Cloud credits are not ready. Complete the Supabase setup first." }, { status: 503 });
  let consumed = false;
  if (context.cloud) {
    const consume = await databaseRpc<{ ok: boolean; credits_remaining?: number }>("consume_guest_credit", { p_workspace_hash: context.workspaceHash });
    if (consume.error || !consume.data) return NextResponse.json({ error: "Unable to verify your scan credits. Please retry." }, { status: 503 });
    if (!consume.data.ok) return NextResponse.json({ error: "You are out of scan credits. Choose a plan to continue." }, { status: 402 });
    consumed = true;
  }
  try {
    const page = await fetchPublicHtml(inputUrl);
    const headers: Record<string, string | string[] | undefined> = {};
    for (const [key, value] of Object.entries(page.headers)) headers[key.toLowerCase()] = value;
    const result = runAudit({ url: inputUrl, finalUrl: page.finalUrl, html: page.body, headers });
    if (context.cloud && context.workspace) {
      const saved = await databaseInsert("audit_scans", { workspace_id: context.workspace.id, target_url: result.finalUrl, score: result.score, findings: result.findings });
      if (saved.error) {
        await databaseRpc("refund_guest_credit", { p_workspace_hash: context.workspaceHash });
        return NextResponse.json({ error: "The review ran, but its report could not be saved. Please try again." }, { status: 503 });
      }
      const refreshed = await databaseRpc<{ credits_remaining: number; is_founder: boolean }>("get_or_create_guest_workspace", { p_workspace_hash: context.workspaceHash });
      return NextResponse.json({ result, mode: "cloud", creditsRemaining: Number(refreshed.data?.credits_remaining ?? 0), isFounder: Boolean(refreshed.data?.is_founder) }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ result, mode: "local" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (consumed) await databaseRpc("refund_guest_credit", { p_workspace_hash: context.workspaceHash });
    return NextResponse.json({ error: error instanceof Error ? error.message : "The website could not be reviewed." }, { status: 422 });
  }
}