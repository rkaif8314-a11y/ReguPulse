import { cookies } from "next/headers";
import { createHmac, randomUUID } from "node:crypto";
import { databaseConfigured, databaseRpc } from "@/lib/supabase-admin";

function validId(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}
export async function getWorkspaceContext() {
  const jar = await cookies();
  let guestId = jar.get("rp_guest")?.value;
  if (!validId(guestId)) {
    guestId = randomUUID();
    jar.set("rp_guest", guestId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" });
  }
  const secret = process.env.GUEST_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "regupulse-local-preview-secret";
  const workspaceHash = createHmac("sha256", secret).update(guestId).digest("hex");
  if (!databaseConfigured()) return { workspaceHash, workspace: null, cloud: false };
  const { data, error } = await databaseRpc<Record<string, unknown>>("get_or_create_guest_workspace", { p_workspace_hash: workspaceHash });
  if (error || !data) return { workspaceHash, workspace: null, cloud: true, error: error ?? "Workspace could not be loaded." };
  return { workspaceHash, workspace: data, cloud: true };
}