import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestWorkspace } from "@/lib/firebase/guest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkoutSchema = z.object({ plan: z.enum(["starter", "growth", "agency"]) });
const planEnv: Record<string, string> = {
  starter: "RAZORPAY_PLAN_STARTER",
  growth: "RAZORPAY_PLAN_GROWTH",
  agency: "RAZORPAY_PLAN_AGENCY",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid subscription plan." }, { status: 400 });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const planId = process.env[planEnv[parsed.data.plan]];
    if (!keyId || !keySecret || !planId) {
      return NextResponse.json({ error: "Subscription checkout is not configured yet. The site owner must add Razorpay keys and the three monthly plan IDs." }, { status: 503 });
    }

    const workspace = await getGuestWorkspace();
    if (!workspace.cloud) return NextResponse.json({ error: "Cloud workspace storage must be configured before a paid subscription can be started." }, { status: 503 });

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: planId,
        total_count: 120,
        quantity: 1,
        customer_notify: true,
        notes: { workspace_id: workspace.workspaceId, plan: parsed.data.plan },
      }),
      cache: "no-store",
    });
    const data = await response.json() as { id?: string; short_url?: string; error?: { description?: string } };
    if (!response.ok || !data.short_url || !data.id) {
      return NextResponse.json({ error: data.error?.description || "Razorpay could not create the subscription." }, { status: 502 });
    }
    return NextResponse.json({ checkoutUrl: data.short_url, subscriptionId: data.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout could not be started." }, { status: 500 });
  }
}
