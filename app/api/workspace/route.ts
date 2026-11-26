import { NextResponse } from "next/server";
import { getGuestWorkspace } from "@/lib/firebase/guest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getGuestWorkspace();
  return NextResponse.json({
    mode: context.cloud ? "cloud" : "local",
    workspaceId: context.workspaceId,
    creditsRemaining: context.workspace?.credits_remaining ?? null,
    plan: context.workspace?.plan_tier ?? "free",
    isFounder: context.workspace?.is_founder ?? false,
    subscriptionStatus: context.workspace?.subscription_status ?? "inactive",
    costs: { websiteScan: 1, fileReview: 5 },
  }, { headers: { "Cache-Control": "no-store" } });
}
