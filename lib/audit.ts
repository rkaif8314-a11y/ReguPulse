import { randomUUID } from "node:crypto";

export type AuditFinding = {
  id: string;
  category: "Accessibility" | "Privacy" | "Cookies" | "Security" | "Content";
  title: string;
  status: "pass" | "warning" | "fail";
  detail: string;
  recommendation: string;
  weight: number;
};
export type AuditResult = {
  id: string;
  host: string;
  finalUrl: string;
  score: number;
  createdAt: string;
  findings: AuditFinding[];
  summary: string;
};

function tags(html: string, name: string) {
  return html.match(new RegExp("<" + name + "\\b[^>]*>", "gi")) ?? [];
}
function attr(tag: string, name: string) {
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*(['\"])(.*?)\\1", "i"));
  return match?.[2] ?? null;
}
function textContent(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function runAudit(input: {
  url: string;
  finalUrl: string;
  html: string;
  headers: Record<string, string | string[] | undefined>;
}): AuditResult {
  const html = input.html;
  const plain = textContent(html);
  const header = (name: string) => String(input.headers[name.toLowerCase()] ?? "").toLowerCase();
  const imageTags = tags(html, "img");
  const imagesWithAlt = imageTags.filter((tag) => attr(tag, "alt") !== null).length;
  const formControls = [...tags(html, "input"), ...tags(html, "select"), ...tags(html, "textarea")]
    .filter((tag) => !/type\s*=\s*["']hidden["']/i.test(tag));
  const labeledControls = formControls.filter((tag) => {
    if (attr(tag, "aria-label") || attr(tag, "aria-labelledby")) return true;
    const id = attr(tag, "id");
    return Boolean(id && (html.includes('for="' + id + '"') || html.includes("for='" + id + "'")));
  }).length;
  const links = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? [];
  const namedLinks = links.filter((link) => {
    const opening = link.slice(0, link.indexOf(">") + 1);
    const inner = link.slice(link.indexOf(">") + 1).replace(/<[^>]+>/g, "").trim();
    return Boolean(inner || attr(opening, "aria-label") || attr(opening, "title"));
  }).length;
  const htmlTag = tags(html, "html")[0] ?? "";
  const hasPrivacy = /privacy policy|privacy notice|data protection|personal data/i.test(plain)
    || /href\s*=\s*["'][^"']*(privacy|data-protection)/i.test(html);
  const hasCookieChoices = /cookie/.test(plain) && /(consent|preferences|manage|settings|choices)/.test(plain);
  const hasFormDisclosure = formControls.length === 0 || /(privacy|consent|personal data|data use)/.test(plain);

  const rule = (
    id: string,
    category: AuditFinding["category"],
    title: string,
    ok: boolean,
    detail: string,
    recommendation: string,
    weight: number
  ): AuditFinding => ({
    id, category, title, status: ok ? "pass" : "warning",
    detail, recommendation: ok ? "" : recommendation, weight
  });

  const findings: AuditFinding[] = [
    rule("https", "Security", "Secure HTTPS connection", input.finalUrl.startsWith("https://"),
      "The inspected page is served over an encrypted HTTPS connection.",
      "Serve the website over HTTPS and redirect all HTTP requests to the secure version.", 10),
    rule("hsts", "Security", "HTTP Strict Transport Security", Boolean(header("strict-transport-security")),
      "HSTS tells browsers to prefer secure connections on future visits.",
      "Configure a Strict-Transport-Security header after confirming all relevant subdomains support HTTPS.", 8),
    rule("csp", "Security", "Content Security Policy", Boolean(header("content-security-policy")),
      "A Content Security Policy can reduce the impact of certain script-injection attacks.",
      "Define a policy for trusted scripts, styles, frames and other content sources. Start in report-only mode.", 8),
    rule("nosniff", "Security", "Content type protection", /nosniff/.test(header("x-content-type-options")),
      "The response should prevent browsers from guessing a different content type.",
      "Add X-Content-Type-Options: nosniff to the response headers.", 5),
    rule("referrer", "Security", "Referrer policy", Boolean(header("referrer-policy")),
      "A referrer policy controls how much navigation context is shared with other sites.",
      "Set a policy such as strict-origin-when-cross-origin, then review analytics requirements.", 5),
    rule("privacy", "Privacy", "Privacy information is discoverable", hasPrivacy,
      "A visible privacy notice or policy helps visitors understand how information is handled.",
      "Add a clearly named privacy notice and link it from the footer and relevant data-collection points.", 10),
    rule("form-disclosure", "Privacy", "Form data-use context", hasFormDisclosure,
      formControls.length ? "The page contains form controls; visitors should understand why information is collected." : "No visible form controls were detected on the inspected page.",
      "Place a concise data-use notice beside forms and link to the full privacy notice.", 8),
    rule("cookies", "Cookies", "Cookie choice information", hasCookieChoices,
      "Cookie-related wording and a way to manage preferences should be easy to find when non-essential cookies are used.",
      "Provide clear accept, reject and preference controls before setting non-essential cookies where required.", 10),
    rule("language", "Accessibility", "Document language", Boolean(attr(htmlTag, "lang")),
      "A language attribute helps assistive technology pronounce page content correctly.",
      "Set an accurate lang attribute on the root html element, for example lang=\"en\".", 8),
    rule("images", "Accessibility", "Images have alternative text", imageTags.length === 0 || imagesWithAlt === imageTags.length,
      imageTags.length ? imagesWithAlt + " of " + imageTags.length + " image elements include an alt attribute." : "No image elements were detected.",
      "Add concise alternative text to informative images. Use alt=\"\" for decorative images.", 10),
    rule("forms", "Accessibility", "Form controls have labels", formControls.length === 0 || labeledControls === formControls.length,
      formControls.length ? labeledControls + " of " + formControls.length + " form controls have a detectable programmatic label." : "No form controls were detected.",
      "Associate every form control with a visible label or an appropriate accessible name.", 10),
    rule("links", "Accessibility", "Links have meaningful names", links.length === 0 || namedLinks === links.length,
      links.length ? namedLinks + " of " + links.length + " links have detectable text or an accessible name." : "No links were detected.",
      "Use descriptive link text or provide an accessible name for icon-only links.", 8),
    rule("title", "Content", "Page title is present", /<title\b[^>]*>\s*[^<\s][\s\S]*?<\/title>/i.test(html),
      "A specific page title helps visitors understand the page and supports browser navigation.",
      "Add a concise, unique title that describes the page content.", 5),
    rule("description", "Content", "Meta description is present", /<meta\b[^>]*name\s*=\s*["']description["']/i.test(html),
      "A meta description provides a short summary that may be used in search previews.",
      "Add a useful meta description for the page.", 3)
  ];

  const totalWeight = findings.reduce((sum, item) => sum + item.weight, 0);
  const earned = findings.reduce((sum, item) =>
    sum + (item.status === "pass" ? item.weight : item.status === "warning" ? item.weight * 0.35 : 0), 0);
  const score = Math.max(0, Math.min(100, Math.round((earned / totalWeight) * 100)));
  const count = findings.filter((item) => item.status === "pass").length;
  const review = findings.filter((item) => item.status === "warning").length;

  return {
    id: randomUUID(),
    host: new URL(input.finalUrl).hostname,
    finalUrl: input.finalUrl,
    score,
    createdAt: new Date().toISOString(),
    findings,
    summary: count + " checks passed; " + review + " need review."
  };
}