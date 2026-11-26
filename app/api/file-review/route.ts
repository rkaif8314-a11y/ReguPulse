import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { consumeCredits, FILE_REVIEW_CREDIT_COST, getGuestWorkspace, refundCredits } from "@/lib/firebase/guest";
import { inspectUploadedFile, MAX_UPLOAD_BYTES } from "@/lib/file-inspector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const context = await getGuestWorkspace();
  let charged = false;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to inspect." }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "The file must be 2 MB or smaller." }, { status: 413 });
    if (!file.name || file.name.length > 180) return NextResponse.json({ error: "The file name is invalid." }, { status: 400 });
    const source = await file.text();
    if (!source.trim()) return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });

    if (context.cloud) {
      const charge = await consumeCredits(context.workspaceId, FILE_REVIEW_CREDIT_COST);
      if (!charge.ok) return NextResponse.json({ error: "This tool costs 5 credits. You do not have enough credits remaining." }, { status: 402 });
      charged = true;
    }

    const result = inspectUploadedFile(file.name, source);
    if (context.cloud && isFirebaseConfigured()) {
      const db = getAdminDb();
      const reviewRef = db.collection("file_reviews").doc();
      await reviewRef.set({ ...result, workspace_id: context.workspaceId });
      const workspaceSnap = await db.collection("guest_workspaces").doc(context.workspaceId).get();
      charged = false;
      return NextResponse.json({ result: { ...result, id: reviewRef.id }, mode: "cloud", creditsRemaining: workspaceSnap.data()?.credits_remaining ?? 0 }, { status: 201 });
    }

    return NextResponse.json({ result, mode: "local" }, { status: 201 });
  } catch (error) {
    if (charged) {
      try { await refundCredits(context.workspaceId, FILE_REVIEW_CREDIT_COST); } catch { /* Preserve the original error. */ }
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "The file could not be inspected." }, { status: 422 });
  }
}
