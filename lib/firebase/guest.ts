import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import type { GuestWorkspaceDoc, PlanTier } from "@/lib/types";

export const GUEST_COOKIE = "rp_workspace";
export const SCAN_CREDIT_COST = 1;
export const FILE_REVIEW_CREDIT_COST = 5;

export async function getGuestWorkspace() {
  const cookieStore = await cookies();
  let token = cookieStore.get(GUEST_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = randomBytes(32).toString("hex");
    cookieStore.set(GUEST_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const workspaceId = createHash("sha256").update(token).digest("hex");
  if (!isFirebaseConfigured()) {
    return { workspaceId, workspace: null as GuestWorkspaceDoc | null, cloud: false };
  }

  const db = getAdminDb();
  const workspaceRef = db.collection("guest_workspaces").doc(workspaceId);
  const launchRef = db.collection("system").doc("launch");

  const workspace = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(workspaceRef);
    if (existing.exists) {
      return { id: existing.id, ...(existing.data() as Omit<GuestWorkspaceDoc, "id">) };
    }

    const launchSnap = await transaction.get(launchRef);
    const workspaceCount = Number(launchSnap.data()?.workspace_count ?? 0);
    const now = new Date().toISOString();
    const newWorkspace: Omit<GuestWorkspaceDoc, "id"> = {
      credits_remaining: workspaceCount === 0 ? 100 : 50,
      plan_tier: "free",
      is_founder: workspaceCount === 0,
      subscription_status: "inactive",
      razorpay_subscription_id: null,
      created_at: now,
      updated_at: now,
    };
    transaction.set(workspaceRef, newWorkspace);
    transaction.set(launchRef, {
      workspace_count: workspaceCount + 1,
      updated_at: now,
    }, { merge: true });
    return { id: workspaceId, ...newWorkspace };
  });

  return { workspaceId, workspace, cloud: true };
}

export async function consumeCredits(workspaceId: string, amount: number) {
  const db = getAdminDb();
  const ref = db.collection("guest_workspaces").doc(workspaceId);
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new Error("Workspace not found.");
    const remaining = Number(snap.data()?.credits_remaining ?? 0);
    if (remaining < amount) return { ok: false, remaining };
    transaction.update(ref, {
      credits_remaining: remaining - amount,
      updated_at: new Date().toISOString(),
    });
    return { ok: true, remaining: remaining - amount };
  });
}

export async function refundCredits(workspaceId: string, amount: number) {
  const db = getAdminDb();
  await db.collection("guest_workspaces").doc(workspaceId).update({
    credits_remaining: FieldValue.increment(amount),
    updated_at: new Date().toISOString(),
  });
}

export async function grantPlanCredits(workspaceId: string, plan: Exclude<PlanTier, "free">, subscriptionId: string) {
  const credits: Record<Exclude<PlanTier, "free">, number> = {
    starter: 150,
    growth: 600,
    agency: 2500,
  };
  await getAdminDb().collection("guest_workspaces").doc(workspaceId).set({
    plan_tier: plan,
    credits_remaining: credits[plan],
    subscription_status: "active",
    razorpay_subscription_id: subscriptionId,
    updated_at: new Date().toISOString(),
  }, { merge: true });
}
