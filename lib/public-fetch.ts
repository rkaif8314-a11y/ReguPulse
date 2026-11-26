import https from "node:https";
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

type AddressRecord = { address: string; family: number };
type PageResponse = { status: number; headers: Record<string, string | string[] | undefined>; body: string; finalUrl: string };
const MAX_BYTES = 1_000_000;

function publicIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const a = parts[0], b = parts[1], c = parts[2];
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 0 || b === 168)) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}
function publicAddress(address: string, family: number) {
  if (family === 4 || isIP(address) === 4) return publicIpv4(address);
  const value = address.toLowerCase().split("%")[0];
  if (value.startsWith("::ffff:")) {
    const mapped = value.slice(7);
    return isIP(mapped) === 4 && publicIpv4(mapped);
  }
  if (value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd") || /^fe[89ab]/.test(value) || value.startsWith("ff")) return false;
  const first = parseInt(value.split(":")[0] || "0", 16);
  return first >= 0x2000 && first <= 0x3fff && !value.startsWith("2001:db8");
}
async function resolvePublic(hostname: string): Promise<AddressRecord[]> {
  if (isIP(hostname)) throw new Error("Enter a domain name, not a raw IP address.");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) throw new Error("Private and local network addresses cannot be scanned.");
  const records = await dnsLookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => !publicAddress(record.address, record.family))) throw new Error("This domain resolves to a private or reserved network address and cannot be scanned.");
  return records;
}
function requestPinned(url: URL, records: AddressRecord[]): Promise<PageResponse> {
  return new Promise((resolve, reject) => {
    const first = records[0];
    if (!first) { reject(new Error("The domain could not be resolved.")); return; }
    const pinnedLookup = (_hostname: string, options: { all?: boolean } | number, callback: (...args: unknown[]) => void) => {
      if (typeof options === "object" && options.all) callback(null, records);
      else callback(null, first.address, first.family);
    };
    const request = https.request(url, {
      method: "GET",
      headers: { "User-Agent": "ReguPulse-Website-Review/1.0", "Accept": "text/html,application/xhtml+xml;q=0.9" },
      lookup: pinnedLookup as never,
      servername: url.hostname,
      timeout: 10000,
      maxHeaderSize: 16384
    }, (response) => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      response.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_BYTES) { request.destroy(new Error("The page is larger than the 1 MB scan limit.")); return; }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({
        status: response.statusCode ?? 0,
        headers: response.headers,
        body: Buffer.concat(chunks).toString("utf8"),
        finalUrl: url.toString()
      }));
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("The website took too long to respond.")));
    request.on("error", reject);
    request.end();
  });
}
export async function fetchPublicHtml(input: string): Promise<PageResponse> {
  let current: URL;
  try { current = new URL(input); } catch { throw new Error("Enter a valid website URL."); }
  if (current.protocol !== "https:") throw new Error("For safety, scans currently support HTTPS websites only.");
  if (current.username || current.password || (current.port && current.port !== "443")) throw new Error("This URL uses credentials or a non-standard port and cannot be scanned.");
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    if (current.protocol !== "https:") throw new Error("The website redirected away from HTTPS. The scan was stopped.");
    const records = await resolvePublic(current.hostname);
    const response = await requestPinned(current, records);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      if (!location || redirect === 3) throw new Error("The website redirected too many times.");
      const nextLocation = Array.isArray(location) ? location[0] : location;
      if (!nextLocation) throw new Error("The redirect destination is invalid.");
      current = new URL(nextLocation, current);
      if (current.username || current.password || (current.port && current.port !== "443")) throw new Error("The redirect uses an unsupported URL.");
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new Error("The website returned HTTP " + response.status + ".");
    const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("The address did not return an HTML page.");
    return response;
  }
  throw new Error("The website could not be reached safely.");
}