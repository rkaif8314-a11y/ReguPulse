const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export function databaseConfigured() { return Boolean(baseUrl && serviceKey); }
function headers(extra?: Record<string, string>) {
  return { apikey: serviceKey ?? "", Authorization: "Bearer " + (serviceKey ?? ""), "Content-Type": "application/json", ...extra };
}
export async function databaseRpc<T = unknown>(name: string, args: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
  if (!databaseConfigured()) return { data: null, error: "Database is not configured." };
  try {
    const response = await fetch(baseUrl + "/rest/v1/rpc/" + name, { method: "POST", headers: headers(), body: JSON.stringify(args), cache: "no-store" });
    if (!response.ok) return { data: null, error: await response.text() };
    return { data: await response.json() as T, error: null };
  } catch (error) { return { data: null, error: error instanceof Error ? error.message : "Database request failed." }; }
}
export async function databaseInsert(table: string, value: Record<string, unknown>) {
  if (!databaseConfigured()) return { error: "Database is not configured." };
  try {
    const response = await fetch(baseUrl + "/rest/v1/" + table, { method: "POST", headers: headers({ Prefer: "return=minimal" }), body: JSON.stringify(value), cache: "no-store" });
    return { error: response.ok ? null : await response.text() };
  } catch (error) { return { error: error instanceof Error ? error.message : "Database request failed." }; }
}
export async function databaseSelect(table: string, query: string) {
  if (!databaseConfigured()) return { data: [], error: null };
  try {
    const response = await fetch(baseUrl + "/rest/v1/" + table + "?" + query, { method: "GET", headers: headers(), cache: "no-store" });
    if (!response.ok) return { data: [], error: await response.text() };
    return { data: await response.json() as Record<string, unknown>[], error: null };
  } catch (error) { return { data: [], error: error instanceof Error ? error.message : "Database request failed." }; }
}