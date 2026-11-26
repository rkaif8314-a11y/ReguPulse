import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { databaseConfigured } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const planEnv: Record<string, string> = { starter: "RAZORPAY_PLAN_STARTER", growth: "RAZORPAY_PLAN_GROWTH", agency: "RAZORPAY_PLAN_AGENCY" };

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Choose a valid plan." }, { status: 400 }); }
  const plan = typeof payload === "object" && payload !== null && "plan" in payload ? String((payload as { plan: unknown }).plan) : "";
  const envName = planEnv[plan];
  if (!envName) return NextResponse.json({ error: "That plan is not available." }, { status: 400 });
  const keyId = process.env.RAZORPAY_KEY_ID, keySecret = process.env.RAZORPAY_KEY_SECRET, razorpayPlanId = process.env[envName];
  if (!keyId || !keySecret || !razorpayPlanId || !databaseConfigured()) return NextResponse.json({ error: "Subscription checkout is not active yet. The site owner must configure Supabase and the Razorpay monthly plan IDs." }, { status: 503 });
  const context = await getWorkspaceContext();
  if (!context.workspace) return NextResponse.json({ error: "Your guest workspace could not be loaded." }, { status: 503 });
  const auth = Buffer.from(keyId + ":" + keySecret).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" },
    body: JSON.stringify({ plan_id: razorpayPlanId, total_count: 12, quantity: 1, customer_notify: 1, notes: { workspace_hash: context.workspaceHash, plan } }),
    cache: "no-store"
  });
  const data = await response.json();
  if (!response.ok || !data.short_url) return NextResponse.json({ error: "Razorpay could not start the subscription. Check the plan ID and test-mode credentials." }, { status: 502 });
  return NextResponse.json({ checkoutUrl: data.short_url });
}