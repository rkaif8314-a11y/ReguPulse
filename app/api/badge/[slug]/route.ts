import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const snap = await getAdminDb().collection("monitored_sites").where("slug", "==", slug).limit(1).get();
  const site = snap.empty ? null : snap.docs[0].data();
  const verified = Boolean(site?.badge_verified);
  const score = Number(site?.last_score ?? 0);
  const label = verified ? `ReguPulse review • ${score}/100` : "ReguPulse • Review pending";
  const accent = verified ? "#10b981" : "#9ca3af";
  const width = verified ? 245 : 205;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="32" viewBox="0 0 ${width} 32" role="img" aria-label="${label}"><rect width="${width}" height="32" rx="6" fill="#111827"/><circle cx="16" cy="16" r="5" fill="${accent}"/><text x="29" y="20" fill="#f8fafc" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" font-weight="500">${label}</text></svg>`;
  return new NextResponse(svg, { status: 200, headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=300" } });
}
