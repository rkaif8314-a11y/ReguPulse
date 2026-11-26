import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getAdminDb } from "@/lib/firebase/admin";
import { grantPlanCredits } from "@/lib/firebase/guest";
import type { PlanTier } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validSignature(body: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!secret) return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 });
  const rawBody = await request.text();
  if (!signature || !validSignature(rawBody, signature, secret)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });

  let event: Record<string, unknown>;
  try { event = JSON.parse(rawBody) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid webhook body." }, { status: 400 }); }

  const eventName = String(event.event || "");
  const payload = event.payload as Record<string, unknown> | undefined;
  const subscriptionPayload = payload?.subscription as Record<string, unknown> | undefined;
  const entity = subscriptionPayload?.entity as Record<string, unknown> | undefined;
  const notes = entity?.notes as Record<string, unknown> | undefined;
  const workspaceId = String(notes?.workspace_id || "");
  const plan = String(notes?.plan || "");
  const subscriptionId = String(entity?.id || "");
  const db = getAdminDb();
  const eventId = String(event.id || createHash("sha256").update(rawBody).digest("hex"));
  const eventRef = db.collection("razorpay_webhook_events").doc(eventId);
  const shouldProcess = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(eventRef);
    if (existing.exists) return false;
    transaction.create(eventRef, { event: eventName, status: "processing", created_at: new Date().toISOString() });
    return true;
  });
  if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true });

  try {
    if (eventName === "subscription.charged" && workspaceId && ["starter", "growth", "agency"].includes(plan) && subscriptionId) {
      await grantPlanCredits(workspaceId, plan as Exclude<PlanTier, "free">, subscriptionId);
    } else if (["subscription.activated", "subscription.resumed"].includes(eventName) && workspaceId && subscriptionId) {
      await db.collection("guest_workspaces").doc(workspaceId).set({
        subscription_status: "active",
        razorpay_subscription_id: subscriptionId,
        ...(plan && ["starter", "growth", "agency"].includes(plan) ? { plan_tier: plan } : {}),
        updated_at: new Date().toISOString(),
      }, { merge: true });
    } else if (["subscription.cancelled", "subscription.halted"].includes(eventName) && workspaceId) {
      await db.collection("guest_workspaces").doc(workspaceId).set({
        subscription_status: eventName === "subscription.halted" ? "halted" : "cancelled",
        ...(eventName === "subscription.cancelled" ? { plan_tier: "free", credits_remaining: 50, razorpay_subscription_id: null } : {}),
        updated_at: new Date().toISOString(),
      }, { merge: true });
    }
    await eventRef.update({ status: "processed", processed_at: new Date().toISOString() });
  } catch (error) {
    await eventRef.delete();
    throw error;
  }

  return NextResponse.json({ received: true });
}
