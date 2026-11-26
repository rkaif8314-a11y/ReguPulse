import * as cheerio from "cheerio";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import type { ComplianceIssue, DetectedTech, PassedCheck, ScanResult } from "@/lib/types";
import { computeRiskLevel } from "@/lib/utils";
import { COMPLIANCE_RULES } from "./rules";
import { getRuleGuidance } from "./guidance";
import { resolveSafeUrl, SSRFError, type SafeAddress, type SafeTarget } from "./ssrf-guard";

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;

type PageResponse = { status: number; headers: Record<string, string | string[] | undefined>; body: string };

function requestPinned(target: SafeTarget): Promise<PageResponse> {
  return new Promise((resolve, reject) => {
    const { url, addresses } = target;
    const first = addresses[0];
    if (!first) { reject(new SSRFError("The website domain did not resolve.")); return; }
    const lookup = (_hostname: string, options: { all?: boolean } | number, callback: (...args: unknown[]) => void) => {
      if (typeof options === "object" && options.all) callback(null, addresses);
      else callback(null, first.address, first.family);
    };
    const commonOptions = {
      method: "GET" as const,
      headers: {
        "User-Agent": "ReguPulse-WebsiteReview/2.0",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Encoding": "identity",
        "Accept-Language": "en-IN,en;q=0.9",
      },
      lookup: lookup as never,
      timeout: TIMEOUT_MS,
      maxHeaderSize: 16 * 1024,
    };
    let request: http.ClientRequest;
    const onResponse = (response: http.IncomingMessage) => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      response.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_BODY_BYTES) {
          request.destroy(new Error("The page is larger than the 2 MB review limit."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        const headers: Record<string, string | string[] | undefined> = {};
        for (const [key, value] of Object.entries(response.headers)) headers[key.toLowerCase()] = value;
        resolve({ status: response.statusCode ?? 0, headers, body });
      });
      response.on("error", reject);
    };
    request = url.protocol === "https:"
      ? https.request(url, { ...commonOptions, servername: net.isIP(url.hostname.replace(/^\[|\]$/g, "")) === 0 ? url.hostname.replace(/^\[|\]$/g, "") : undefined }, onResponse)
      : http.request(url, commonOptions, onResponse);
    request.on("timeout", () => request.destroy(new Error("The website took too long to respond.")));
    request.on("error", reject);
    request.end();
  });
}

async function fetchHtmlSafely(rawUrl: string): Promise<{ finalUrl: URL; html: string; headers: Record<string, string | string[] | undefined> }> {
  let target = await resolveSafeUrl(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await requestPinned(target);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      const destination = Array.isArray(location) ? location[0] : location;
      if (!destination) throw new Error(`Redirect (${response.status}) did not include a Location header.`);
      if (hop === MAX_REDIRECTS) throw new Error("The website redirected too many times.");
      target = await resolveSafeUrl(new URL(destination, target.url).toString());
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new Error(`The website returned HTTP ${response.status}.`);
    const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error(`The address did not return an HTML page (${contentType || "unknown content type"}).`);
    return { finalUrl: target.url, html: response.body, headers: response.headers };
  }
  throw new SSRFError("Redirect validation terminated unexpectedly.");
}

function detectTechStack(html: string, headers: Record<string, string | string[] | undefined>): DetectedTech {
  const lowerHtml = html.toLowerCase();
  const signatures: Record<"analytics" | "consent_platforms" | "cms_or_framework", Array<[string, RegExp]>> = {
    analytics: [
      ["Google Analytics / Tag Manager", /googletagmanager\.com|google-analytics\.com|gtag\(/i],
      ["Meta Pixel", /connect\.facebook\.net\/.*fbevents|fbq\(/i],
      ["TikTok Pixel", /analytics\.tiktok\.com|ttq\./i],
      ["Hotjar", /static\.hotjar\.com|hj\(/i],
      ["Microsoft Clarity", /clarity\.ms\/tag/i],
      ["Segment", /cdn\.segment\.com|analytics\.load/i],
    ],
    consent_platforms: [
      ["Cookiebot", /cookiebot\.com|consent\.cookiebot/i],
      ["OneTrust", /onetrust\.com|optanon/i],
      ["Osano", /cmp\.osano\.com/i],
      ["Klaro", /klaro/i],
      ["CookieYes", /cookieyes\.com|cky-consent/i],
      ["Consent interface markup", /(cookie-consent|cookie-banner|cc-window|gdpr-consent)/i],
    ],
    cms_or_framework: [
      ["Next.js", /__next_data__|_next\/static/i], ["WordPress", /wp-content|wp-includes/i],
      ["Shopify", /cdn\.shopify\.com|shopify\.theme/i], ["Webflow", /webflow\.js|data-wf-site/i],
      ["React", /data-reactroot|__react/i],
    ],
  };
  const matchList = (items: Array<[string, RegExp]>) => items.filter(([, pattern]) => pattern.test(lowerHtml)).map(([name]) => name);
  return {
    analytics: matchList(signatures.analytics),
    consent_platforms: matchList(signatures.consent_platforms),
    cms_or_framework: matchList(signatures.cms_or_framework),
    security_headers: {
      hsts: Boolean(headers["strict-transport-security"]),
      csp: Boolean(headers["content-security-policy"]),
      x_content_type_options: Boolean(headers["x-content-type-options"]),
      x_frame_options: Boolean(headers["x-frame-options"]),
    },
  };
}

export async function scanWebsite(rawUrl: string): Promise<ScanResult> {
  const startedAt = Date.now();
  const { finalUrl, html, headers } = await fetchHtmlSafely(rawUrl);
  const $ = cheerio.load(html);
  const detectedTech = detectTechStack(html, headers);
  const textOnly = cheerio.load(html);
  textOnly("script, style, noscript").remove();
  const visibleText = textOnly("body").text().replace(/\s+/g, " ").trim();

  const issues: ComplianceIssue[] = [];
  const passedChecks: PassedCheck[] = [];
  const pillars = ["ACCESSIBILITY", "PRIVACY", "SECURITY", "GENERAL"] as const;
  const deductions: Record<(typeof pillars)[number], number> = { ACCESSIBILITY: 0, PRIVACY: 0, SECURITY: 0, GENERAL: 0 };

  for (const rule of COMPLIANCE_RULES) {
    const result = rule.evaluate({ $, url: finalUrl, html, headers: Object.fromEntries(Object.entries(headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : value || ""])), visibleText, detectedTech });
    if (result.passed) {
      passedChecks.push({ rule_id: rule.id, pillar: rule.pillar, title: rule.title });
    } else {
      deductions[rule.pillar] += rule.points_deducted;
      issues.push({
        rule_id: rule.id, pillar: rule.pillar, severity: rule.severity, title: rule.title,
        legal_reference: rule.legal_reference, description: result.description,
        affected_snippets: result.affected_snippets.slice(0, 3), points_deducted: rule.points_deducted,
        ...getRuleGuidance(rule.id, result.description),
      });
    }
  }

  const pillarScores = Object.fromEntries(pillars.map((pillar) => {
    const maxDeductions = COMPLIANCE_RULES.filter((rule) => rule.pillar === pillar).reduce((sum, rule) => sum + rule.points_deducted, 0);
    return [pillar, maxDeductions === 0 ? 100 : Math.max(0, Math.min(100, Math.round(100 - (deductions[pillar] / maxDeductions) * 100)))];
  })) as Record<(typeof pillars)[number], number>;
  const overallScore = Math.round(pillarScores.ACCESSIBILITY * 0.35 + pillarScores.PRIVACY * 0.25 + pillarScores.SECURITY * 0.20 + pillarScores.GENERAL * 0.20);
  const severityRank: Record<ComplianceIssue["severity"], number> = { CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
  issues.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  return {
    target_url: finalUrl.toString(),
    normalized_domain: finalUrl.hostname.replace(/^www\./, "").toLowerCase(),
    overall_score: overallScore,
    accessibility_score: pillarScores.ACCESSIBILITY,
    privacy_score: pillarScores.PRIVACY,
    security_score: pillarScores.SECURITY,
    general_score: pillarScores.GENERAL,
    risk_level: computeRiskLevel(overallScore),
    detected_tech: detectedTech,
    issues,
    passed_checks: passedChecks,
    scan_duration_ms: Date.now() - startedAt,
    total_rules_checked: COMPLIANCE_RULES.length,
    passed_rules_count: COMPLIANCE_RULES.length - issues.length,
    created_at: new Date().toISOString(),
  };
}
