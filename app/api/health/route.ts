import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    status: "ok", application: "ReguPulse",
    database: databaseConfigured() ? "configured" : "local-preview",
    billing: process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? "configured" : "not-configured",
    authentication: "deferred"
  }, { headers: { "Cache-Control": "no-store" } });
}