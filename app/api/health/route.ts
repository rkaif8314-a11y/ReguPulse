import { NextResponse } from "next/server";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ status: "ok", application: "ReguPulse", storage: isFirebaseConfigured() ? "configured" : "local-preview", billing: process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? "configured" : "not-configured", authentication: "deferred", websiteScanCost: 1, fileReviewCost: 5 }, { headers: { "Cache-Control": "no-store" } });
}
