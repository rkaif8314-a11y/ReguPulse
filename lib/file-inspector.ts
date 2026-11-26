import * as cheerio from "cheerio";
import { randomUUID } from "node:crypto";
import type { FileReviewFinding, FileReviewResult, RuleSeverity } from "@/lib/types";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["html", "htm", "css", "js", "jsx", "ts", "tsx", "json", "md", "txt"]);

function lineAt(source: string, offset: number) {
  return offset < 0 ? null : source.slice(0, offset).split("\n").length;
}
function finding(input: Omit<FileReviewFinding, "id">): FileReviewFinding {
  return { id: randomUUID(), ...input };
}
function scanHtml(source: string, findings: FileReviewFinding[]) {
  const $ = cheerio.load(source);
  $("img").each((_, el) => {
    if ($(el).attr("alt") !== undefined || $(el).attr("aria-hidden") === "true") return;
    const markup = $.html(el);
    const at = source.indexOf(markup);
    findings.push(finding({
      category: "Accessibility", severity: "HIGH", title: "Image is missing alternative text", line: lineAt(source, at),
      evidence: markup.slice(0, 240),
      why_it_matters: "Visitors who cannot see the image need a text alternative when the image communicates information. Without one, the image's meaning is unavailable to assistive technology.",
      recommendation: "Add a concise description for meaningful images. Use an empty alt attribute only for decorative images that add no information.",
      verification_steps: ["Open the image in its page context.", "Decide whether it conveys information or is decorative.", "Add the appropriate alt value and test using a screen reader or with images disabled."],
      suggested_rewrite: markup.replace(/<img\b/i, '<img alt="TODO: describe this image"'),
    }));
  });
  $("input, select, textarea").each((_, el) => {
    const type = ($(el).attr("type") || "").toLowerCase();
    if (["hidden", "submit", "button", "reset"].includes(type)) return;
    const id = $(el).attr("id");
    const labelled = Boolean($(el).attr("aria-label") || $(el).attr("aria-labelledby") || (id && $(`label[for="${id.replace(/"/g, "\\\"")}"]`).length) || $(el).closest("label").length);
    if (labelled) return;
    const markup = $.html(el), at = source.indexOf(markup);
    findings.push(finding({
      category: "Accessibility", severity: "HIGH", title: "Form control has no programmatic label", line: lineAt(source, at), evidence: markup.slice(0, 240),
      why_it_matters: "A form control without an accessible name is difficult to use with a screen reader or voice control. Visitors may not know what information is required.",
      recommendation: "Add a visible label linked through for/id, wrap the control in a label, or use a suitable accessible name when a visible label is not possible.",
      verification_steps: ["Find the control in its form.", "Add a meaningful label connected to it.", "Tab to the control and confirm the label is announced."],
      suggested_rewrite: `<!-- Add a visible label and connect it to this control -->\n<label for="${id || "field-name"}">Describe this field</label>\n${markup}`,
    }));
  });
  $("a[href], button").each((_, el) => {
    const text = $(el).text().trim();
    const name = $(el).attr("aria-label") || $(el).attr("title") || $(el).find("img[alt]").attr("alt") || "";
    if (text || name) return;
    const markup = $.html(el), at = source.indexOf(markup);
    findings.push(finding({
      category: "Accessibility", severity: "HIGH", title: "Interactive element has no accessible name", line: lineAt(source, at), evidence: markup.slice(0, 240),
      why_it_matters: "A button or link without a discernible name provides no reliable indication of its purpose to assistive technology.",
      recommendation: "Add meaningful visible text or a concise aria-label that describes the action or destination.",
      verification_steps: ["Inspect the control in the accessibility tree.", "Add an accessible name that remains meaningful outside surrounding text.", "Test with keyboard navigation and a screen reader."],
      suggested_rewrite: markup.replace(/<([a-z]+)/i, `<$1 aria-label="TODO: describe the action"`),
    }));
  });
  $("a[target='_blank'], a[target=\"_blank\"]").each((_, el) => {
    const rel = ($(el).attr("rel") || "").toLowerCase();
    if (rel.includes("noopener")) return;
    const markup = $.html(el), at = source.indexOf(markup);
    findings.push(finding({
      category: "Security", severity: "MODERATE", title: "External new-tab link lacks opener protection", line: lineAt(source, at), evidence: markup.slice(0, 240),
      why_it_matters: "A page opened in a new tab should not be able to control the originating tab through the window.opener relationship.",
      recommendation: "Add rel=\"noopener noreferrer\" to external links that use target=\"_blank\".",
      verification_steps: ["Locate the external link.", "Add rel=\"noopener noreferrer\".", "Test the link and confirm it opens as expected."],
      suggested_rewrite: markup.replace(/<a\b/i, `<a rel="noopener noreferrer"`),
    }));
  });
  const htmlTag = $("html").first();
  if (htmlTag.length && !htmlTag.attr("lang")) {
    findings.push(finding({
      category: "Accessibility", severity: "HIGH", title: "HTML document language is missing", line: lineAt(source, source.search(/<html\b/i)),
      evidence: source.match(/<html\b[^>]*>/i)?.[0] || "<html>",
      why_it_matters: "Assistive technology uses the document language to pronounce content correctly.",
      recommendation: "Add the correct language code, such as en or hi, to the root html element. Choose the language actually used by the page.",
      verification_steps: ["Confirm the page's primary language.", "Add lang to the root html element.", "Test a screen reader's pronunciation on a sample paragraph."],
      suggested_rewrite: (source.match(/<html\b[^>]*>/i)?.[0] || "<html>").replace(/>$/, ' lang="en"> <!-- Change en if the page uses another language -->'),
    }));
  }
  if (!$("title").text().trim()) {
    findings.push(finding({
      category: "SEO", severity: "MODERATE", title: "Document title is missing", line: null, evidence: "No non-empty <title> was found.",
      why_it_matters: "The title identifies the page in browser tabs, history and search previews.", recommendation: "Add a distinct title that describes the page's actual topic.",
      verification_steps: ["Add a title inside the document head.", "Keep it specific to the current page.", "Reload and confirm the tab title is correct."],
      suggested_rewrite: "<title>TODO: Add a concise page title</title>",
    }));
  }
  const viewport = ($('meta[name="viewport"]').attr("content") || "").toLowerCase();
  if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/.test(viewport)) {
    const old = $('meta[name="viewport"]').first().toString();
    findings.push(finding({
      category: "Accessibility", severity: "HIGH", title: "Viewport settings restrict zoom", line: lineAt(source, source.indexOf(old)), evidence: old,
      why_it_matters: "Restricting browser zoom can prevent low-vision visitors from enlarging page content.",
      recommendation: "Remove user-scalable=no and restrictive maximum-scale values. Let visitors zoom the page.",
      verification_steps: ["Update the viewport meta content.", "Open the page on a mobile device.", "Test zoom up to 200% and confirm content remains available."],
      suggested_rewrite: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    }));
  }
  const lower = source.toLowerCase();
  if (/google-analytics|googletagmanager|fbq\s*\(|hotjar|clarity\.ms|tiktok\.com/.test(lower) && !/(cookie consent|cookie preferences|manage cookies|consent settings)/.test(lower)) {
    findings.push(finding({
      category: "Privacy", severity: "HIGH", title: "Tracking code found without visible consent controls", line: null,
      evidence: "A recognised analytics or advertising script signature was found in this file.",
      why_it_matters: "Some tracking technologies may require a visitor choice before they are activated. A scan of one source file cannot determine the complete consent behaviour.",
      recommendation: "Review the complete tag-loading flow and ensure non-essential tracking waits for the visitor's required consent choice.",
      verification_steps: ["Clear cookies and open the deployed page in a private browser.", "Inspect network requests before accepting optional cookies.", "Reject optional tracking and confirm its requests remain blocked."],
      suggested_rewrite: "Review script loading order and connect non-essential tags to your consent manager; do not simply remove tracking without reviewing the business need.",
    }));
  }
}

function scanSource(source: string, extension: string, findings: FileReviewFinding[]) {
  if (["html", "htm", "jsx", "tsx"].includes(extension) && /<html\b|<img\b|<form\b|<button\b/i.test(source)) {
    scanHtml(source, findings);
  }
  if (["js", "jsx", "ts", "tsx"].includes(extension)) {
    const checks: Array<{ re: RegExp; title: string; severity: RuleSeverity; detail: string; fix: string; category: FileReviewFinding["category"] }> = [
      { re: /\beval\s*\(/g, title: "Dynamic eval execution detected", severity: "HIGH", detail: "eval executes a string as code and can turn untrusted input into executable instructions.", fix: "Prefer structured data parsing or an explicit function map. Avoid evaluating user-controlled strings.", category: "Security" },
      { re: /document\.write\s*\(/g, title: "document.write usage detected", severity: "MODERATE", detail: "document.write can replace document content or interfere with page loading when called after initial parsing.", fix: "Create elements with DOM APIs or render through your framework rather than writing raw HTML into the document stream.", category: "Code quality" },
      { re: /\.innerHTML\s*=/g, title: "Direct innerHTML assignment detected", severity: "HIGH", detail: "Writing untrusted content to innerHTML can create a cross-site scripting risk.", fix: "Use textContent for plain text or sanitise trusted rich HTML with a maintained HTML sanitizer before insertion.", category: "Security" },
      { re: /catch\s*\(\s*\w+\s*\)\s*\{\s*\}/g, title: "Empty error handler detected", severity: "LOW", detail: "Silently swallowing an error makes failures difficult to diagnose and can hide unexpected states.", fix: "Handle the expected error explicitly, record safe diagnostic context and provide a useful fallback to the visitor.", category: "Code quality" },
    ];
    for (const check of checks) {
      let match: RegExpExecArray | null;
      while ((match = check.re.exec(source)) !== null) {
        findings.push(finding({
          category: check.category, severity: check.severity, title: check.title, line: lineAt(source, match.index), evidence: match[0],
          why_it_matters: check.detail, recommendation: check.fix,
          verification_steps: ["Locate the exact use shown in the evidence.", "Replace it with the safer pattern described above.", "Test the affected user flow and run the file review again."],
          suggested_rewrite: check.fix,
        }));
      }
    }
  }
  if (extension === "css") {
    const patterns = [
      { re: /:focus(?:-visible)?\s*\{[^}]*outline\s*:\s*(?:none|0)/gi, title: "Keyboard focus outline is removed", severity: "HIGH" as RuleSeverity, detail: "Removing focus outlines can make keyboard navigation difficult because users lose the visible indication of focus." },
      { re: /font-size\s*:\s*(?:[0-9]|1[0-1])px\b/gi, title: "Very small fixed text size found", severity: "LOW" as RuleSeverity, detail: "Small fixed text can be difficult to read on mobile devices and for visitors with low vision." },
    ];
    for (const check of patterns) {
      let match: RegExpExecArray | null;
      while ((match = check.re.exec(source)) !== null) {
        findings.push(finding({ category: "Accessibility", severity: check.severity, title: check.title, line: lineAt(source, match.index), evidence: match[0], why_it_matters: check.detail, recommendation: "Review the affected selector and provide a responsive, visible focus or readable text treatment.", verification_steps: ["Find the selector containing this declaration.", "Update the style without removing keyboard access.", "Test keyboard focus and the page at a narrow viewport."], suggested_rewrite: check.title.includes("focus") ? ":focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }" : "Use a relative, readable text size and test at 200% zoom." }));
      }
    }
  }
  if (["md", "txt"].includes(extension)) {
    if (extension === "md" && !/^#\s+\S/m.test(source)) {
      findings.push(finding({
        category: "Content", severity: "LOW", title: "Markdown document has no main heading", line: null,
        evidence: "No level-one Markdown heading was detected.",
        why_it_matters: "A main heading gives readers an immediate idea of the document's subject and makes a long note easier to navigate.",
        recommendation: "Add one concise level-one heading, then use lower heading levels to organise sections in a logical hierarchy.",
        verification_steps: ["Read the first screen of the document.", "Add a clear heading that describes the document's purpose.", "Check the outline in your Markdown preview."],
        suggested_rewrite: "# Add a clear document title\n\nIntroduce the purpose of this document in one or two sentences.",
      }));
    }
    const vagueLink = /\[(?:click here|here|read more|learn more)\]\([^)]+\)/i.exec(source);
    if (vagueLink) {
      findings.push(finding({
        category: "Content", severity: "MODERATE", title: "Link text is too generic", line: lineAt(source, vagueLink.index), evidence: vagueLink[0],
        why_it_matters: "Generic link labels are hard to understand when read out of context and do not communicate the destination.",
        recommendation: "Replace the link label with a short description of the destination or action.",
        verification_steps: ["Review the destination page or file.", "Rename the link so its purpose is clear when read alone.", "Read the document's links without surrounding paragraphs."],
        suggested_rewrite: vagueLink[0].replace(/^\[[^\]]+\]/, "[Describe the destination]"),
      }));
    }
    if (/\b(?:TODO|TBD|lorem ipsum|insert here|replace this text)\b/i.test(source)) {
      const match = /\b(?:TODO|TBD|lorem ipsum|insert here|replace this text)\b/i.exec(source);
      findings.push(finding({
        category: "Content", severity: "LOW", title: "Placeholder text remains in the file", line: match ? lineAt(source, match.index) : null,
        evidence: "A draft placeholder was detected. The exact placeholder is intentionally not repeated.",
        why_it_matters: "Unresolved placeholders can make a document or interface look unfinished and may expose internal drafting notes.",
        recommendation: "Replace the placeholder with approved, accurate content or remove the draft section before publication.",
        verification_steps: ["Search the final file for TODO, TBD and placeholder phrases.", "Review each remaining draft note with its owner.", "Check the published version after deployment."],
        suggested_rewrite: "Replace the placeholder with final, reviewed content before publishing.",
      }));
    }
  }

  const secretPatterns = [/(?:sk_live_|sk_test_)[A-Za-z0-9]{12,}/, /AKIA[0-9A-Z]{16}/, /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, /AIza[0-9A-Za-z_-]{30,}/];
  for (const pattern of secretPatterns) {
    const match = pattern.exec(source);
    if (match) {
      findings.push(finding({
        category: "Security", severity: "CRITICAL", title: "Credential-like value may be exposed in source", line: lineAt(source, match.index),
        evidence: "A credential-like pattern was found. The value has been redacted from this report.",
        why_it_matters: "A credential committed to browser-delivered code or shared files may be copied and abused. Treat a confirmed exposed credential as compromised.",
        recommendation: "Remove the value from client-side code, rotate it with the provider, store the replacement in a server-only environment variable and review repository history.",
        verification_steps: ["Confirm whether the matched value is a real credential.", "Revoke or rotate it immediately if it is real.", "Move secrets to server-side environment variables and verify they are not included in client bundles."],
        suggested_rewrite: "const value = process.env.SERVER_ONLY_SECRET; // read this only on the server; do not ship secrets to the browser",
      }));
      break;
    }
  }

  if (extension === "json") {
    try { JSON.parse(source); } catch (error) {
      findings.push(finding({ category: "Code quality", severity: "HIGH", title: "JSON syntax is invalid", line: null, evidence: error instanceof Error ? error.message : "JSON parse failed.", why_it_matters: "Invalid JSON cannot be parsed by applications that depend on this file, which can break configuration or data loading.", recommendation: "Fix the syntax error and validate the file with a JSON parser before deploying it.", verification_steps: ["Open the JSON parser error and locate the reported line/column.", "Check commas, quotes, braces and brackets.", "Run the JSON parser again and confirm it succeeds."], suggested_rewrite: null }));
    }
  }
}

export function inspectUploadedFile(filename: string, source: string): FileReviewResult {
  if (Buffer.byteLength(source, "utf8") > MAX_FILE_BYTES) throw new Error("The uploaded file exceeds the 2 MB limit.");
  const extension = filename.split(".").pop()?.toLowerCase() || "txt";
  if (!ALLOWED_EXTENSIONS.has(extension)) throw new Error("Supported formats: HTML, CSS, JavaScript, TypeScript, JSON, Markdown and TXT.");
  const findings: FileReviewFinding[] = [];
  scanSource(source, extension, findings);
  const weighted = findings.reduce((sum, item) => sum + (item.severity === "CRITICAL" ? 18 : item.severity === "HIGH" ? 12 : item.severity === "MODERATE" ? 7 : 3), 0);
  const score = Math.max(0, Math.min(100, 100 - weighted));
  const summary = findings.length
    ? `${findings.length} finding(s) were identified. Review the evidence, apply the relevant suggestions and test the updated file before deployment.`
    : "No issues were identified by the available static checks. Manual review is still recommended.";
  return { id: randomUUID(), filename, file_type: extension.toUpperCase(), score, findings, summary, created_at: new Date().toISOString() };
}

export const MAX_UPLOAD_BYTES = MAX_FILE_BYTES;
