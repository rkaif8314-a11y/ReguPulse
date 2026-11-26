import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { databaseRpc } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validSignature(body: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const left = Buffer.from(expected), right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!secret) return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 });
  const rawBody = await request.text();
  if (!signature || !validSignature(rawBody, signature, secret)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  let event: Record<string, unknown>;
  try { event = JSON.parse(rawBody) as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid event body." }, { status: 400 }); }
  const eventName = String(event.event ?? "");
  const payload = event.payload as Record<string, unknown> | undefined;
  const subscriptionPayload = payload?.subscription as Record<string, unknown> | undefined;
  const subscription = subscriptionPayload?.entity as Record<string, unknown> | undefined;
  const notes = subscription?.notes as Record<string, unknown> | undefined;
  const workspaceHash = String(notes?.workspace_hash ?? ""), plan = String(notes?.plan ?? "");
  if ((eventName === "subscription.activated" || eventName === "subscription.charged") && workspaceHash && ["starter", "growth", "agency"].includes(plan)) {
    const update = await databaseRpc("activate_guest_plan", { p_workspace_hash: workspaceHash, p_plan: plan });
    if (update.error) return NextResponse.json({ error: "Subscription event could not be saved." }, { status: 503 });
  } else if ((eventName === "subscription.cancelled" || eventName === "subscription.halted") && workspaceHash) {
    const update = await databaseRpc("deactivate_guest_plan", { p_workspace_hash: workspaceHash });
    if (update.error) return NextResponse.json({ error: "Cancellation event could not be saved." }, { status: 503 });
  }
  return NextResponse.json({ received: true });
}