import type { CheerioAPI } from "cheerio";
import type { ComplianceIssue, DetectedTech } from "@/lib/types";

export interface RuleContext {
  $: CheerioAPI;
  url: URL;
  html: string;
  headers: Record<string, string>;
  visibleText: string;
  detectedTech: DetectedTech;
}

export interface ComplianceRule {
  id: string;
  pillar: ComplianceIssue["pillar"];
  severity: ComplianceIssue["severity"];
  title: string;
  legal_reference: string;
  points_deducted: number;
  evaluate: (ctx: RuleContext) => { passed: boolean; description: string; affected_snippets: string[] };
}

function snippet($: CheerioAPI, el: Parameters<CheerioAPI>[0]): string {
  const raw = $.html(el).trim().replace(/\s+/g, " ");
  return raw.length > 260 ? `${raw.slice(0, 257)}...` : raw;
}

const ISO_639_1 = new Set([
  "aa","ab","ae","af","ak","am","an","ar","as","av","ay","az","ba","be","bg","bh","bi","bm","bn","bo","br","bs",
  "ca","ce","ch","co","cr","cs","cu","cv","cy","da","de","dv","dz","ee","el","en","eo","es","et","eu","fa","ff",
  "fi","fj","fo","fr","fy","ga","gd","gl","gn","gu","gv","ha","he","hi","ho","hr","ht","hu","hy","hz","ia","id",
  "ie","ig","ii","ik","io","is","it","iu","ja","jv","ka","kg","ki","kj","kk","kl","km","kn","ko","kr","ks","ku",
  "kv","kw","ky","la","lb","lg","li","ln","lo","lt","lu","lv","mg","mh","mi","mk","ml","mn","mr","ms","mt","my",
  "na","nb","nd","ne","ng","nl","nn","no","nr","nv","ny","oc","oj","om","or","os","pa","pi","pl","ps","pt","qu",
  "rm","rn","ro","ru","rw","sa","sc","sd","se","sg","si","sk","sl","sm","sn","so","sq","sr","ss","st","su","sv",
  "sw","ta","te","tg","th","ti","tk","tl","tn","to","tr","ts","tt","tw","ty","ug","uk","ur","uz","ve","vi","vo",
  "wa","wo","xh","yi","yo","za","zh","zu",
]);

export const COMPLIANCE_RULES: ComplianceRule[] = [
  // =========================================================================
  // ACCESSIBILITY — WCAG-oriented structural checks (14 rules)
  // =========================================================================
  {
    id: "ACC-01",
    pillar: "ACCESSIBILITY",
    severity: "CRITICAL",
    title: "Missing or Invalid HTML Document Language Attribute",
    legal_reference: "WCAG 2.2 SC 3.1.1 (Level A)",
    points_deducted: 15,
    evaluate: ({ $ }) => {
      const lang = ($("html").attr("lang") || "").trim().toLowerCase();
      const primary = lang.split("-")[0];
      if (lang && ISO_639_1.has(primary)) {
        return { passed: true, description: "", affected_snippets: [] };
      }
      const htmlTag = $("html").get(0);
      const attrs = htmlTag && "attribs" in htmlTag ? JSON.stringify(htmlTag.attribs) : "{}";
      return {
        passed: false,
        description: lang
          ? `Invalid <html> lang attribute "${lang}". Must start with a valid ISO 639-1 language code.`
          : "<html> element is missing the required lang attribute for screen readers.",
        affected_snippets: [`<html ${attrs}>`],
      };
    },
  },
  {
    id: "ACC-02",
    pillar: "ACCESSIBILITY",
    severity: "CRITICAL",
    title: "Images Missing Alt Attribute",
    legal_reference: "WCAG 2.2 SC 1.1.1 (Level A)",
    points_deducted: 15,
    evaluate: ({ $ }) => {
      const bad: string[] = [];
      let count = 0;
      $("img").each((_, el) => {
        const hasAlt = $(el).attr("alt") !== undefined;
        const ariaHidden = $(el).attr("aria-hidden") === "true";
        const role = $(el).attr("role");
        if (!hasAlt && !ariaHidden && role !== "presentation" && role !== "none") {
          count++;
          if (bad.length < 3) bad.push(snippet($, el));
        }
      });
      if (count === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${count} <img> element(s) missing an alt attribute (use alt="" for decorative images).`,
        affected_snippets: bad,
      };
    },
  },
  {
    id: "ACC-03",
    pillar: "ACCESSIBILITY",
    severity: "CRITICAL",
    title: "Form Controls Missing Accessible Labels",
    legal_reference: "WCAG 2.2 SC 1.3.1 & 4.1.2 (Level A)",
    points_deducted: 15,
    evaluate: ({ $ }) => {
      const bad: string[] = [];
      let count = 0;
      $("input, select, textarea").each((_, el) => {
        const tag = el.tagName.toLowerCase();
        const type = ($(el).attr("type") || "text").toLowerCase();
        if (tag === "input" && ["hidden", "submit", "button", "reset", "image"].includes(type)) return;
        const id = $(el).attr("id");
        const hasForLabel = id ? $(`label[for="${id.replace(/"/g, '\\"')}"]`).length > 0 : false;
        const wrappedInLabel = $(el).closest("label").length > 0;
        const hasAria = Boolean($(el).attr("aria-label")?.trim() || $(el).attr("aria-labelledby")?.trim());
        if (!hasForLabel && !wrappedInLabel && !hasAria) {
          count++;
          if (bad.length < 3) bad.push(snippet($, el));
        }
      });
      if (count === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${count} form control(s) without a linked <label>, wrapping <label>, aria-label, or aria-labelledby.`,
        affected_snippets: bad,
      };
    },
  },
  {
    id: "ACC-04",
    pillar: "ACCESSIBILITY",
    severity: "CRITICAL",
    title: "Empty Buttons or Links Without Discernible Text",
    legal_reference: "WCAG 2.2 SC 2.4.4 & 4.1.2 (Level A)",
    points_deducted: 12,
    evaluate: ({ $ }) => {
      const bad: string[] = [];
      let count = 0;
      $("button, a[href]").each((_, el) => {
        const text = $(el).text().trim();
        const aria = ($(el).attr("aria-label") || $(el).attr("aria-labelledby") || $(el).attr("title") || "").trim();
        const imgAlt = $(el).find("img[alt]").filter((_, img) => ($(img).attr("alt") || "").trim().length > 0).length > 0;
        const svgTitle = $(el).find("svg title").text().trim().length > 0;
        if (!text && !aria && !imgAlt && !svgTitle) {
          count++;
          if (bad.length < 3) bad.push(snippet($, el));
        }
      });
      if (count === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${count} interactive <button> or <a> element(s) with no accessible name for assistive technologies.`,
        affected_snippets: bad,
      };
    },
  },
  {
    id: "ACC-05",
    pillar: "ACCESSIBILITY",
    severity: "HIGH",
    title: "Heading Hierarchy Violations",
    legal_reference: "WCAG 2.2 SC 1.3.1 & 2.4.6 (Level AA)",
    points_deducted: 10,
    evaluate: ({ $ }) => {
      const headings = $("h1, h2, h3, h4, h5, h6").toArray();
      const h1Count = $("h1").length;
      const bad: string[] = [];
      const issues: string[] = [];
      if (h1Count === 0) issues.push("Page is missing a primary <h1> heading.");
      if (h1Count > 1) {
        issues.push(`Page has ${h1Count} <h1> headings (should have exactly 1).`);
        $("h1").slice(0, 3).each((_, el) => { bad.push(snippet($, el)); });
      }
      let prev = 0;
      for (const h of headings) {
        const level = Number(h.tagName.slice(1));
        if (prev > 0 && level > prev + 1) {
          issues.push(`Skipped heading level from <h${prev}> to <h${level}>.`);
          if (bad.length < 3) bad.push(snippet($, h));
        }
        prev = level;
      }
      if (issues.length === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: issues.join(" "),
        affected_snippets: bad.length ? bad : ["No <h1> element found in document."],
      };
    },
  },
  {
    id: "ACC-06",
    pillar: "ACCESSIBILITY",
    severity: "HIGH",
    title: "Missing Semantic Landmark Regions",
    legal_reference: "WCAG 2.2 SC 1.3.1 & 2.4.1 (Level A)",
    points_deducted: 8,
    evaluate: ({ $ }) => {
      const missing: string[] = [];
      if ($('main, [role="main"]').length === 0) missing.push("<main>");
      if ($('header, [role="banner"]').length === 0) missing.push("<header>");
      if ($('nav, [role="navigation"]').length === 0) missing.push("<nav>");
      if ($('footer, [role="contentinfo"]').length === 0) missing.push("<footer>");
      if (missing.length === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Missing essential ARIA/HTML5 landmark region(s): ${missing.join(", ")}.`,
        affected_snippets: [`Missing landmarks: ${missing.join(", ")}`],
      };
    },
  },
  {
    id: "ACC-07",
    pillar: "ACCESSIBILITY",
    severity: "HIGH",
    title: "Iframe Elements Missing Descriptive Title",
    legal_reference: "WCAG 2.2 SC 2.4.1 & 4.1.2 (Level A)",
    points_deducted: 8,
    evaluate: ({ $ }) => {
      const bad: string[] = [];
      let count = 0;
      $("iframe").each((_, el) => {
        const title = ($(el).attr("title") || "").trim();
        const ariaHidden = $(el).attr("aria-hidden") === "true";
        if (!title && !ariaHidden) {
          count++;
          if (bad.length < 3) bad.push(snippet($, el));
        }
      });
      if (count === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${count} <iframe> element(s) missing a descriptive title attribute.`,
        affected_snippets: bad,
      };
    },
  },
  {
    id: "ACC-08",
    pillar: "ACCESSIBILITY",
    severity: "MODERATE",
    title: "Viewport Meta Tag Disables User Zoom",
    legal_reference: "WCAG 2.2 SC 1.4.4 (Level AA)",
    points_deducted: 8,
    evaluate: ({ $ }) => {
      const viewport = $('meta[name="viewport"]');
      const content = (viewport.attr("content") || "").toLowerCase();
      if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/.test(content)) {
        return {
          passed: false,
          description: "Viewport meta tag restricts pinch-to-zoom, blocking low-vision users from scaling text to 200%.",
          affected_snippets: [snippet($, viewport)],
        };
      }
      return { passed: true, description: "", affected_snippets: [] };
    },
  },
  {
    id: "ACC-09",
    pillar: "ACCESSIBILITY",
    severity: "MODERATE",
    title: "Autoplaying Media Without Muted or Controls",
    legal_reference: "WCAG 2.2 SC 1.4.2 (Level A)",
    points_deducted: 6,
    evaluate: ({ $ }) => {
      const bad: string[] = [];
      let count = 0;
      $("video[autoplay], audio[autoplay]").each((_, el) => {
        const muted = $(el).attr("muted") !== undefined;
        const controls = $(el).attr("controls") !== undefined;
        if (!muted || !controls) {
          count++;
          if (bad.length < 3) bad.push(snippet($, el));
        }
      });
      if (count === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${count} autoplaying <video>/<audio> element(s) lacking muted or controls attributes.`,
        affected_snippets: bad,
      };
    },
  },
  {
    id: "ACC-10",
    pillar: "ACCESSIBILITY",
    severity: "MODERATE",
    title: "Non-Descriptive Link Text",
    legal_reference: "WCAG 2.2 SC 2.4.4 (Level A)",
    points_deducted: 5,
    evaluate: ({ $ }) => {
      const vague = new Set(["click here", "read more", "learn more", "here", "more", "link"]);
      const bad: string[] = [];
      let count = 0;
      $("a[href]").each((_, el) => {
        const text = $(el).text().trim().toLowerCase();
        const aria = ($(el).attr("aria-label") || "").trim();
        if (vague.has(text) && !aria) {
          count++;
          if (bad.length < 3) bad.push(snippet($, el));
        }
      });
      if (count === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${count} link(s) with generic text ("click here", "read more", "learn more") and no aria-label context.`,
        affected_snippets: bad,
      };
    },
  },
  {
    id: "ACC-11",
    pillar: "ACCESSIBILITY",
    severity: "MODERATE",
    title: "Data Tables Missing Headers or Caption",
    legal_reference: "WCAG 2.2 SC 1.3.1 (Level A)",
    points_deducted: 5,
    evaluate: ({ $ }) => {
      const bad: string[] = [];
      let count = 0;
      $("table").each((_, el) => {
        const role = $(el).attr("role");
        if (role === "presentation" || role === "none") return;
        const hasTh = $(el).find("th").length > 0;
        const hasCaption = $(el).find("caption").length > 0 || Boolean($(el).attr("aria-label"));
        if (!hasTh || !hasCaption) {
          count++;
          if (bad.length < 3) bad.push(snippet($, el));
        }
      });
      if (count === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${count} <table> element(s) missing <th> header cells or an accessible <caption>/aria-label.`,
        affected_snippets: bad,
      };
    },
  },
  {
    id: "ACC-12",
    pillar: "ACCESSIBILITY",
    severity: "LOW",
    title: "Positive Tabindex Values Disrupting Focus Order",
    legal_reference: "WCAG 2.2 SC 2.4.3 (Level A)",
    points_deducted: 4,
    evaluate: ({ $ }) => {
      const bad: string[] = [];
      let count = 0;
      $("[tabindex]").each((_, el) => {
        const val = Number($(el).attr("tabindex"));
        if (!Number.isNaN(val) && val > 0) {
          count++;
          if (bad.length < 3) bad.push(snippet($, el));
        }
      });
      if (count === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${count} element(s) with positive tabindex (>0), which breaks logical keyboard tab navigation.`,
        affected_snippets: bad,
      };
    },
  },
  {
    id: "ACC-13",
    pillar: "ACCESSIBILITY",
    severity: "LOW",
    title: "Missing Skip-to-Main-Content Navigation Link",
    legal_reference: "WCAG 2.2 SC 2.4.1 (Level A)",
    points_deducted: 4,
    evaluate: ({ $ }) => {
      let hasSkip = false;
      $('a[href^="#"]').slice(0, 6).each((_, el) => {
        const text = $(el).text().toLowerCase();
        if (/(skip to|jump to|skip navigation|main content)/.test(text)) {
          hasSkip = true;
        }
      });
      if (hasSkip) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: "No 'Skip to main content' anchor link found at the top of the DOM for keyboard-only users.",
        affected_snippets: ["<body> missing initial <a href=\"#main\">Skip to main content</a> link."],
      };
    },
  },
  {
    id: "ACC-14",
    pillar: "ACCESSIBILITY",
    severity: "LOW",
    title: "Duplicate DOM Element IDs",
    legal_reference: "WCAG 2.2 SC 4.1.1 / ARIA Reference Integrity",
    points_deducted: 4,
    evaluate: ({ $ }) => {
      const seen = new Map<string, number>();
      const bad: string[] = [];
      $("[id]").each((_, el) => {
        const id = ($(el).attr("id") || "").trim();
        if (!id) return;
        const next = (seen.get(id) ?? 0) + 1;
        seen.set(id, next);
        if (next === 2 && bad.length < 3) {
          bad.push(snippet($, el));
        }
      });
      const dupes = Array.from(seen.entries()).filter(([, c]) => c > 1);
      if (dupes.length === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${dupes.length} duplicate id value(s) (${dupes.slice(0, 3).map(([k]) => `#${k}`).join(", ")}), which breaks <label for> and aria-labelledby bindings.`,
        affected_snippets: bad,
      };
    },
  },

  // =========================================================================
  // PRIVACY, COOKIE & SECURITY — practical disclosure and response checks (10 rules)
  // =========================================================================
  {
    id: "PRV-01",
    pillar: "SECURITY",
    severity: "CRITICAL",
    title: "Missing HTTPS or HSTS Transport Security",
    legal_reference: "GDPR Art. 32 / PCI-DSS 4.0",
    points_deducted: 20,
    evaluate: ({ url, headers }) => {
      const isHttps = url.protocol === "https:";
      const hasHsts = Boolean(headers["strict-transport-security"]);
      if (isHttps && hasHsts) return { passed: true, description: "", affected_snippets: [] };
      const reasons: string[] = [];
      if (!isHttps) reasons.push("Site served over unencrypted HTTP.");
      if (!hasHsts) reasons.push("Missing Strict-Transport-Security (HSTS) response header.");
      return {
        passed: false,
        description: reasons.join(" "),
        affected_snippets: [`URL: ${url.origin} | HSTS: ${headers["strict-transport-security"] || "absent"}`],
      };
    },
  },
  {
    id: "PRV-02",
    pillar: "PRIVACY",
    severity: "CRITICAL",
    title: "Missing Privacy Policy Link",
    legal_reference: "GDPR Art. 13 / CCPA Sec. 1798.100 / DPDP Sec. 5",
    points_deducted: 20,
    evaluate: ({ $ }) => {
      let found = false;
      $("a[href]").each((_, el) => {
        const combined = `${$(el).text()} ${$(el).attr("href") || ""}`.toLowerCase();
        if (/(privacy|datenschutz|confidentialit|privacidad)/.test(combined)) {
          found = true;
        }
      });
      if (found) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: "No visible Privacy Policy link found in navigation or footer.",
        affected_snippets: ["No <a href> matching 'privacy' detected on page."],
      };
    },
  },
  {
    id: "PRV-03",
    pillar: "PRIVACY",
    severity: "HIGH",
    title: "Third-Party Trackers Loaded Without Consent Management Platform",
    legal_reference: "ePrivacy Directive Art. 5(3) / GDPR Art. 6(1)(a)",
    points_deducted: 20,
    evaluate: ({ $, detectedTech }) => {
      if (detectedTech.analytics.length === 0) {
        return { passed: true, description: "", affected_snippets: [] };
      }
      if (detectedTech.consent_platforms.length > 0) {
        return { passed: true, description: "", affected_snippets: [] };
      }
      const snippets: string[] = [];
      $("script[src], script").each((_, el) => {
        const raw = ($(el).attr("src") || $(el).html() || "").toLowerCase();
        if (/(googletagmanager|google-analytics|fbevents|tiktok|hotjar|clarity|segment|mixpanel)/.test(raw) && snippets.length < 3) {
          snippets.push(snippet($, el));
        }
      });
      return {
        passed: false,
        description: `Detected tracking scripts (${detectedTech.analytics.join(", ")}) without a detectable Cookie Consent Management Platform (CMP).`,
        affected_snippets: snippets.length ? snippets : [`Trackers: ${detectedTech.analytics.join(", ")}`],
      };
    },
  },
  {
    id: "PRV-04",
    pillar: "PRIVACY",
    severity: "HIGH",
    title: "Missing Terms of Service Link",
    legal_reference: "EU Digital Services Act Art. 14 / Consumer Law",
    points_deducted: 10,
    evaluate: ({ $ }) => {
      let found = false;
      $("a[href]").each((_, el) => {
        const combined = `${$(el).text()} ${$(el).attr("href") || ""}`.toLowerCase();
        if (/(terms|tos|conditions|agb|legal)/.test(combined)) {
          found = true;
        }
      });
      if (found) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: "No Terms of Service or Terms & Conditions link found on the page.",
        affected_snippets: ["No <a href> matching 'terms' or 'conditions' detected."],
      };
    },
  },
  {
    id: "PRV-05",
    pillar: "PRIVACY",
    severity: "HIGH",
    title: "Missing Refund or Cancellation Disclosure on Commercial Page",
    legal_reference: "FTC Click-to-Cancel / EU Consumer Rights Directive",
    points_deducted: 12,
    evaluate: ({ $, visibleText }) => {
      const hasCommercial = /\b(pricing|subscribe|subscription|checkout|buy now|plan|billing|per month|\/mo)\b/i.test(
        visibleText
      );
      if (!hasCommercial) return { passed: true, description: "", affected_snippets: [] };
      let hasRefundOrCancel = /\b(refund|cancellation|cancel anytime|money-back|return policy)\b/i.test(visibleText);
      $("a[href]").each((_, el) => {
        const combined = `${$(el).text()} ${$(el).attr("href") || ""}`.toLowerCase();
        if (/(refund|cancel|return)/.test(combined)) hasRefundOrCancel = true;
      });
      if (hasRefundOrCancel) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: "Pricing or subscription language detected without a clear refund or cancellation policy disclosure.",
        affected_snippets: ["Commercial/pricing copy present without refund/cancellation policy link."],
      };
    },
  },
  {
    id: "PRV-06",
    pillar: "SECURITY",
    severity: "MODERATE",
    title: "Insecure HTTP Mixed-Content Asset URLs",
    legal_reference: "GDPR Art. 32 / Browser Mixed-Content Security",
    points_deducted: 8,
    evaluate: ({ $, url }) => {
      if (url.protocol !== "https:") return { passed: true, description: "", affected_snippets: [] };
      const bad: string[] = [];
      let count = 0;
      $("script[src^='http://'], img[src^='http://'], link[href^='http://'], iframe[src^='http://']").each((_, el) => {
        count++;
        if (bad.length < 3) bad.push(snippet($, el));
      });
      if (count === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${count} asset(s) loaded over insecure http:// on an HTTPS page.`,
        affected_snippets: bad,
      };
    },
  },
  {
    id: "PRV-07",
    pillar: "SECURITY",
    severity: "MODERATE",
    title: "External Target-Blank Links Missing rel='noopener noreferrer'",
    legal_reference: "OWASP Reverse Tabnabbing / Security Best Practice",
    points_deducted: 6,
    evaluate: ({ $, url }) => {
      const bad: string[] = [];
      let count = 0;
      $('a[target="_blank"]').each((_, el) => {
        const href = $(el).attr("href") || "";
        if (href.startsWith("http") && !href.startsWith(url.origin)) {
          const rel = ($(el).attr("rel") || "").toLowerCase();
          if (!rel.includes("noopener") || !rel.includes("noreferrer")) {
            count++;
            if (bad.length < 3) bad.push(snippet($, el));
          }
        }
      });
      if (count === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Found ${count} external target="_blank" link(s) missing rel="noopener noreferrer".`,
        affected_snippets: bad,
      };
    },
  },
  {
    id: "PRV-08",
    pillar: "SECURITY",
    severity: "LOW",
    title: "Missing Content-Security-Policy or X-Content-Type-Options Headers",
    legal_reference: "OWASP Secure Headers / GDPR Art. 32",
    points_deducted: 5,
    evaluate: ({ headers }) => {
      const missing: string[] = [];
      if (!headers["content-security-policy"]) missing.push("Content-Security-Policy");
      if (!headers["x-content-type-options"]) missing.push("X-Content-Type-Options");
      if (missing.length === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `HTTP response is missing security hardening header(s): ${missing.join(", ")}.`,
        affected_snippets: [`Missing headers: ${missing.join(", ")}`],
      };
    },
  },
  {
    id: "PRV-09",
    pillar: "PRIVACY",
    severity: "MODERATE",
    title: "Missing Data Controller Contact Method",
    legal_reference: "GDPR Art. 13(1)(a) / EU DSA Art. 12",
    points_deducted: 6,
    evaluate: ({ $, visibleText }) => {
      const hasMailto = $('a[href^="mailto:"]').length > 0;
      const hasContactLink = $('a[href*="contact"], a[href*="support"]').length > 0;
      const hasEmailText = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(visibleText);
      if (hasMailto || hasContactLink || hasEmailText) {
        return { passed: true, description: "", affected_snippets: [] };
      }
      return {
        passed: false,
        description: "No visible contact email, mailto link, or contact/support page link found for data subject requests.",
        affected_snippets: ["Missing mailto: link or /contact reference in page DOM."],
      };
    },
  },
  {
    id: "PRV-10",
    pillar: "SECURITY",
    severity: "LOW",
    title: "Insecure Set-Cookie Attributes",
    legal_reference: "OWASP Session Management / GDPR Art. 32",
    points_deducted: 5,
    evaluate: ({ headers }) => {
      const setCookie = headers["set-cookie"];
      if (!setCookie) return { passed: true, description: "", affected_snippets: [] };
      const lower = setCookie.toLowerCase();
      const missing: string[] = [];
      if (!lower.includes("secure")) missing.push("Secure");
      if (!lower.includes("samesite")) missing.push("SameSite");
      if (missing.length === 0) return { passed: true, description: "", affected_snippets: [] };
      return {
        passed: false,
        description: `Response Set-Cookie header is missing recommended security attribute(s): ${missing.join(", ")}.`,
        affected_snippets: [`Set-Cookie: ${setCookie.slice(0, 180)}`],
      };
    },
  },

  // GENERAL WEBSITE QUALITY — discoverability, page identity and sharing (6 rules)
  {
    id: "GEN-01",
    pillar: "GENERAL",
    severity: "HIGH",
    title: "Page title is missing or too vague",
    legal_reference: "Search and browser usability best practice",
    points_deducted: 12,
    evaluate: ({ $ }) => {
      const title = $("title").first().text().trim();
      if (title.length >= 15 && title.length <= 65) return { passed: true, description: "", affected_snippets: [] };
      return { passed: false, description: title ? `Page title contains ${title.length} characters; a descriptive title is usually clearer when it is specific and concise.` : "No document title was found.", affected_snippets: [title ? `<title>${title}</title>` : "Missing <title> element."] };
    },
  },
  {
    id: "GEN-02",
    pillar: "GENERAL",
    severity: "MODERATE",
    title: "Search description is missing or unclear",
    legal_reference: "Search presentation best practice",
    points_deducted: 8,
    evaluate: ({ $ }) => {
      const description = ($('meta[name="description"]').attr("content") || "").trim();
      if (description.length >= 60 && description.length <= 170) return { passed: true, description: "", affected_snippets: [] };
      return { passed: false, description: description ? `Meta description contains ${description.length} characters. It may be too short or too long to summarise the page clearly.` : "No meta description was found.", affected_snippets: [description ? `<meta name="description" content="${description.slice(0, 220)}">` : 'Missing <meta name="description">.'] };
    },
  },
  {
    id: "GEN-03",
    pillar: "GENERAL",
    severity: "LOW",
    title: "Canonical URL is not declared",
    legal_reference: "Search indexing best practice",
    points_deducted: 5,
    evaluate: ({ $ }) => {
      const canonical = $('link[rel="canonical"]').attr("href");
      if (canonical) return { passed: true, description: "", affected_snippets: [] };
      return { passed: false, description: "No canonical link was found. Search engines may have less guidance when the same content is available at multiple URLs.", affected_snippets: ['Missing <link rel="canonical">.'] };
    },
  },
  {
    id: "GEN-04",
    pillar: "GENERAL",
    severity: "LOW",
    title: "Social sharing metadata is incomplete",
    legal_reference: "Open Graph sharing best practice",
    points_deducted: 5,
    evaluate: ({ $ }) => {
      const missing: string[] = [];
      if (!$('meta[property="og:title"]').attr("content")) missing.push("og:title");
      if (!$('meta[property="og:description"]').attr("content")) missing.push("og:description");
      if (!$('meta[property="og:image"]').attr("content")) missing.push("og:image");
      if (!missing.length) return { passed: true, description: "", affected_snippets: [] };
      return { passed: false, description: `Open Graph sharing metadata is missing: ${missing.join(", ")}. Shared links may show incomplete previews.`, affected_snippets: missing.map((name) => `<meta property="${name}" content="...">`) };
    },
  },
  {
    id: "GEN-05",
    pillar: "GENERAL",
    severity: "LOW",
    title: "Site icon is not discoverable",
    legal_reference: "Browser identity and usability best practice",
    points_deducted: 4,
    evaluate: ({ $ }) => {
      if ($('link[rel~="icon"], link[rel="shortcut icon"]').length) return { passed: true, description: "", affected_snippets: [] };
      return { passed: false, description: "No favicon link was detected in the document head. A site icon helps visitors recognise the tab and saved shortcut.", affected_snippets: ['Missing <link rel="icon" href="/favicon.ico">.'] };
    },
  },
  {
    id: "GEN-06",
    pillar: "GENERAL",
    severity: "MODERATE",
    title: "Structured page identity is absent",
    legal_reference: "Structured data and entity clarity best practice",
    points_deducted: 6,
    evaluate: ({ $ }) => {
      if ($('script[type="application/ld+json"]').length) return { passed: true, description: "", affected_snippets: [] };
      return { passed: false, description: "No JSON-LD structured data was found. For organisation, product, article or local-business pages, relevant structured data can make the page identity easier for crawlers to interpret.", affected_snippets: ['No <script type="application/ld+json"> block was detected.'] };
    },
  },
];
