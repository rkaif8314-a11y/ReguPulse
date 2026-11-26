import dns from "node:dns/promises";
import net from "node:net";

export class SSRFError extends Error {
  constructor(message: string) { super(message); this.name = "SSRFError"; }
}

export type SafeAddress = { address: string; family: number };
export type SafeTarget = { url: URL; addresses: SafeAddress[] };

const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "ip6-localhost", "ip6-loopback", "metadata.google.internal", "metadata"]);

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}
function inCidr4(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}
export function isPrivateIPv4(ip: string): boolean {
  if (net.isIPv4(ip) === false) return true;
  return [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
    ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
    ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
    ["224.0.0.0", 4], ["240.0.0.0", 4],
  ].some(([base, bits]) => inCidr4(ip, String(base), Number(bits)));
}
export function isPrivateIPv6(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("::ffff:")) {
    const tail = value.slice(7);
    if (net.isIPv4(tail)) return isPrivateIPv4(tail);
    const hex = tail.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const hi = parseInt(hex[1], 16), lo = parseInt(hex[2], 16);
      return isPrivateIPv4(`${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`);
    }
    return true;
  }
  if (/^f[cd][0-9a-f]{2}:/i.test(value)) return true;
  if (/^fe[89ab][0-9a-f]:/i.test(value)) return true;
  if (/^ff[0-9a-f]{2}:/i.test(value)) return true;
  // IPv6 documentation and benchmarking ranges are not public website destinations.
  if (/^2001:(?:db8|0{1,4}):/i.test(value) || /^2001:2:/i.test(value)) return true;
  return false;
}
export function isBlockedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true;
}

export async function resolveSafeUrl(rawInput: string): Promise<SafeTarget> {
  const trimmed = rawInput.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try { url = new URL(withProtocol); }
  catch { throw new SSRFError("Invalid website URL format."); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new SSRFError("Only HTTP and HTTPS websites are supported.");
  if (url.username || url.password) throw new SSRFError("Embedded URL credentials are not permitted.");
  const expectedPort = url.protocol === "https:" ? "443" : "80";
  if (url.port && url.port !== expectedPort) throw new SSRFError("Non-standard ports are not permitted for website reviews.");

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new SSRFError("Target hostname is restricted.");
  }
  if (net.isIP(hostname) !== 0) {
    if (isBlockedIp(hostname)) throw new SSRFError("Private or reserved IP addresses are blocked.");
    return { url, addresses: [{ address: hostname, family: net.isIP(hostname) }] };
  }

  let records: SafeAddress[];
  try { records = await dns.lookup(hostname, { all: true, verbatim: true }); }
  catch { throw new SSRFError(`Unable to resolve website domain: ${hostname}`); }
  if (!records.length) throw new SSRFError(`No DNS records found for ${hostname}.`);
  if (records.some((record) => isBlockedIp(record.address))) {
    throw new SSRFError("The domain resolves to a private or reserved network address and cannot be reviewed.");
  }
  return { url, addresses: records };
}

export async function assertSafeUrl(rawInput: string): Promise<URL> {
  return (await resolveSafeUrl(rawInput)).url;
}
