type Guidance = {
  why_it_matters: string;
  recommendation: string;
  verification_steps: string[];
};

const GUIDANCE: Record<string, Guidance> = {
  "ACC-01": {
    why_it_matters: "Assistive technologies use the document language to select pronunciation rules. A missing or invalid value can make otherwise readable content difficult to understand.",
    recommendation: "Set a valid language code on the root html element. Use the primary language of the page, and mark language changes on individual passages when needed.",
    verification_steps: ["Inspect the opening <html> element in the rendered DOM.", "Confirm its lang value is a valid language tag such as en, hi, en-IN or fr.", "Use a screen reader to confirm that the page is pronounced in the expected language."],
  },
  "ACC-02": {
    why_it_matters: "People who cannot see an image rely on its alternative text to understand information conveyed by that image. Missing alternatives can hide important content.",
    recommendation: "Write concise, contextual alt text for informative images. Use an empty alt attribute only when an image is purely decorative and adds no information.",
    verification_steps: ["Open the affected image in the page source or inspector.", "Decide whether the image communicates information or is decorative.", "Add meaningful alt text, or alt=\"\" for decorative images, then test with images disabled or a screen reader."],
  },
  "ACC-03": {
    why_it_matters: "Form controls need programmatic names so screen readers can tell users what information to enter and what each control does.",
    recommendation: "Associate each control with a visible label using matching for and id attributes, or place the control inside a label. Use aria-label only when a visible label is not suitable.",
    verification_steps: ["Inspect every input, select and textarea in the affected form.", "Check for a linked label, wrapping label or accessible name.", "Navigate the form with a screen reader and confirm each control is announced with a useful name."],
  },
  "ACC-04": {
    why_it_matters: "Icon-only buttons and links can appear blank to assistive technology when they have no accessible name. Visitors may not know what action will happen.",
    recommendation: "Add visible action text where possible. For icon-only controls, provide a concise aria-label and ensure the icon is hidden from assistive technology when appropriate.",
    verification_steps: ["Inspect each reported button or link in the accessibility tree.", "Confirm the control has a meaningful accessible name that describes its action or destination.", "Test keyboard focus and screen-reader announcements."],
  },
  "ACC-05": {
    why_it_matters: "A consistent heading structure helps people scan a page and navigate between sections using assistive technology.",
    recommendation: "Use one clear page-level h1 and nest section headings in a logical order. Choose heading levels for document structure, not visual size.",
    verification_steps: ["Review the heading outline from top to bottom.", "Check that the main page topic has a clear h1.", "Make sure heading levels do not skip in a way that obscures section relationships."],
  },
  "ACC-06": {
    why_it_matters: "Landmark regions let keyboard and screen-reader users jump directly to the main content, navigation and supporting page regions.",
    recommendation: "Use semantic header, nav, main and footer elements where those regions exist. Avoid adding duplicate main landmarks.",
    verification_steps: ["Inspect the rendered DOM for the missing landmark elements.", "Confirm there is one primary main region.", "Use landmark navigation in a screen reader to verify that regions are named and ordered sensibly."],
  },
  "ACC-07": {
    why_it_matters: "An iframe is a separate browsing context. Without a title, assistive-technology users may not know what the embedded content contains.",
    recommendation: "Give each meaningful iframe a short title that describes the embedded content, such as \"Map showing the office location\".",
    verification_steps: ["Find the reported iframe in the DOM.", "Add a descriptive title attribute or mark the iframe as hidden only if it is truly decorative and unnecessary.", "Check the iframe name using a screen reader."],
  },
  "ACC-08": {
    why_it_matters: "Preventing zoom can stop low-vision users from enlarging page content, especially on small screens.",
    recommendation: "Remove user-scalable=no and restrictive maximum-scale settings from the viewport meta tag. Allow browser zoom.",
    verification_steps: ["Inspect the viewport meta tag in the document head.", "Remove the zoom restriction while preserving the device-width layout.", "Test browser zoom to at least 200% and check for clipped content or lost functionality."],
  },
  "ACC-09": {
    why_it_matters: "Unexpected audio or motion can distract visitors and make a page difficult to use, particularly for people using assistive technology.",
    recommendation: "Avoid autoplay unless it is essential. Provide clear playback controls and ensure automatically playing video is muted when appropriate.",
    verification_steps: ["Locate the reported audio or video element.", "Confirm whether autoplay is necessary for the page task.", "Test the page with sound off and with keyboard-only controls."],
  },
  "ACC-10": {
    why_it_matters: "Generic links such as \"click here\" provide little context when read outside their surrounding paragraph or in a list of links.",
    recommendation: "Rewrite link text so it describes the destination or action, for example \"Read the return policy\" instead of \"Read more\".",
    verification_steps: ["Review the text of each reported link.", "Replace generic wording with a destination-specific phrase.", "Read the links list on its own and confirm that each item still makes sense."],
  },
  "ACC-11": {
    why_it_matters: "Insufficient text contrast makes information difficult to read for people with low vision or colour-vision differences.",
    recommendation: "Choose foreground and background colours that meet the relevant contrast requirement for the text size and weight. Do not communicate meaning by colour alone.",
    verification_steps: ["Measure the actual foreground and background colour pair with a contrast checker.", "Check normal text against the 4.5:1 reference and large text against 3:1.", "Repeat for hover, focus, disabled and error states."],
  },
  "ACC-12": {
    why_it_matters: "Visible focus indicators show keyboard users which control will respond when they press Enter or Space.",
    recommendation: "Keep a clearly visible focus style on interactive controls. Do not remove outlines unless you replace them with an equally clear indicator.",
    verification_steps: ["Navigate the entire page using Tab and Shift+Tab.", "Check links, buttons, menus and form controls for a visible focus indicator.", "Confirm focus is not hidden behind sticky headers or overlays."],
  },
  "ACC-13": {
    why_it_matters: "Accessible names and valid relationships can fail when an id is repeated. Labels and references may point to the wrong element.",
    recommendation: "Give each id a unique value in the document and update all label-for, aria-labelledby and fragment references to match.",
    verification_steps: ["Search the rendered DOM for each duplicate id reported.", "Rename duplicate ids and update any references to them.", "Re-test labels, fragment navigation and automated accessibility checks."],
  },
  "ACC-14": {
    why_it_matters: "Small or tightly packed controls can be hard to activate for people with motor disabilities and users on touch screens.",
    recommendation: "Increase the interactive target area and provide adequate spacing. Keep the control operable without precision pointer movements.",
    verification_steps: ["Measure the rendered target size and spacing at mobile viewport widths.", "Try operating the control with touch, keyboard and a coarse pointer.", "Confirm neighbouring controls do not activate accidentally."],
  },
  "PRV-01": {
    why_it_matters: "HTTPS protects traffic in transit. HSTS tells browsers to keep using secure transport after the first successful secure visit.",
    recommendation: "Use HTTPS on every public route and configure a suitable Strict-Transport-Security header after confirming all covered subdomains support HTTPS.",
    verification_steps: ["Open the URL and confirm HTTP redirects to HTTPS.", "Inspect response headers for strict-transport-security.", "Check max-age and includeSubDomains settings before enabling them broadly."],
  },
  "PRV-02": {
    why_it_matters: "Visitors should be able to find clear information about what personal data is collected, why it is used and how to contact the organisation.",
    recommendation: "Publish a privacy notice written for the actual data practices and link it from the site navigation or footer and from relevant collection forms.",
    verification_steps: ["Open the privacy link as a visitor, without an account.", "Confirm it explains data categories, purposes, sharing, retention and contact routes where applicable.", "Check that forms link to the notice near the point of collection."],
  },
  "PRV-03": {
    why_it_matters: "Analytics and advertising technologies may collect identifiers or behavioural data. A visible consent interface alone does not prove that scripts wait for the required choice.",
    recommendation: "Review which scripts are essential and which require consent. Configure your consent platform to block non-essential tags until the required choice has been recorded.",
    verification_steps: ["Open a fresh private browser session and clear existing consent cookies.", "Inspect network requests before selecting any cookie option.", "Reject optional cookies and confirm non-essential analytics or advertising requests do not run.", "Accept selected categories and verify that only the chosen categories load."],
  },
  "PRV-04": {
    why_it_matters: "Clear service terms help visitors understand the conditions of using the site, including important limitations and responsibilities.",
    recommendation: "Publish terms that accurately describe the service, acceptable use, account or payment rules and relevant limitations. Link them from a predictable location.",
    verification_steps: ["Open the terms page from the primary navigation or footer.", "Check that the page is current and specific to this service.", "Review the terms with appropriate legal advice before relying on them."],
  },
  "PRV-05": {
    why_it_matters: "Visitors should understand renewal, cancellation and refund conditions before they pay or commit to a subscription.",
    recommendation: "Show clear pricing, billing frequency, renewal and cancellation information near the purchase action. Link to a readable refund or cancellation policy.",
    verification_steps: ["Go through the purchase flow as a new customer.", "Confirm the price, currency, renewal interval and cancellation route are visible before payment.", "Test that policy links work on desktop and mobile."],
  },
  "PRV-06": {
    why_it_matters: "Insecure HTTP resources inside an HTTPS page can be blocked or expose visitors to tampering and mixed-content risks.",
    recommendation: "Replace HTTP asset URLs with HTTPS equivalents or host the resource securely on your own domain.",
    verification_steps: ["Open each reported asset URL directly over HTTPS.", "Update the HTML or stylesheet reference.", "Check the browser console for mixed-content warnings after deployment."],
  },
  "PRV-07": {
    why_it_matters: "A new tab opened by an external link should not be able to control the originating page through the window opener relationship.",
    recommendation: "Add rel=\"noopener noreferrer\" to external links that open in a new tab, unless a reviewed product requirement calls for another safe behaviour.",
    verification_steps: ["Inspect each external target=\"_blank\" link.", "Add the recommended rel attributes.", "Re-open the link and confirm it does not expose an opener relationship."],
  },
  "PRV-08": {
    why_it_matters: "Response security headers can reduce exposure to content injection, MIME confusion and unintended framing. The correct policy depends on how the site is built.",
    recommendation: "Add an appropriate Content-Security-Policy and X-Content-Type-Options: nosniff. Test changes in report-only mode first where a policy could block legitimate resources.",
    verification_steps: ["Inspect the final response headers in browser DevTools or a header checker.", "Build a CSP from the resources the site genuinely needs.", "Test forms, media, analytics, payments and embedded content after enabling the policy."],
  },
  "PRV-09": {
    why_it_matters: "Visitors need a reliable route to ask questions about their personal data, request help or contact the organisation responsible for the site.",
    recommendation: "Provide a working contact page or monitored contact email and identify the appropriate privacy contact where required.",
    verification_steps: ["Open the contact route from the public page.", "Send a test enquiry to verify the channel is monitored.", "Confirm privacy-related requests are routed to a responsible team."],
  },
  "PRV-10": {
    why_it_matters: "Cookies used for sessions or preferences can be exposed or behave unexpectedly when security attributes are missing.",
    recommendation: "Review each Set-Cookie header and use Secure for HTTPS-only cookies and an appropriate SameSite value. Add HttpOnly to server-managed session cookies.",
    verification_steps: ["Inspect response Set-Cookie headers in browser DevTools.", "Check Secure, HttpOnly and SameSite values against the cookie's purpose.", "Test login, cross-site redirects and embedded flows after changing cookie settings."],
  },
  "GEN-01": {
    why_it_matters: "The document title is shown in browser tabs, history and many search previews. A vague title makes the page harder to recognise.",
    recommendation: "Write a unique title that names the page's main topic and, when useful, the organisation. Avoid repeating keywords or using one identical title across every page.",
    verification_steps: ["Read the title in the browser tab.", "Compare it with the page's visible h1 and purpose.", "Check that important pages have distinct, accurate titles."],
  },
  "GEN-02": {
    why_it_matters: "A concise summary helps searchers understand what a page offers before they open it. Search engines may rewrite snippets, but a useful description gives them a good starting point.",
    recommendation: "Write a distinct, factual summary that describes the page and its primary value. Avoid generic text copied across the site.",
    verification_steps: ["Read the meta description from the page head.", "Check that it matches the actual page content.", "Review the search preview after the page is indexed."],
  },
  "GEN-03": {
    why_it_matters: "A canonical URL helps indicate the preferred address when the same or very similar page can be reached through multiple URL variants.",
    recommendation: "Add an absolute canonical URL pointing to the preferred, indexable version of the page. Do not canonicalise unrelated pages to the same destination.",
    verification_steps: ["Open the page at its canonical and alternate URL variants.", "Confirm the canonical points to the correct preferred page.", "Check the canonical page returns a successful status and is not blocked from indexing."],
  },
  "GEN-04": {
    why_it_matters: "Open Graph metadata helps messaging apps and social platforms build useful link previews with a title, description and image.",
    recommendation: "Set og:title, og:description and an absolute og:image URL that represent the page. Use an image with appropriate dimensions and provide matching Twitter/X card metadata if needed.",
    verification_steps: ["Inspect the document head for the required Open Graph fields.", "Open the image URL and confirm it loads without authentication.", "Preview the page in a social sharing debugger or messaging client."],
  },
  "GEN-05": {
    why_it_matters: "A recognisable site icon helps visitors identify your website among multiple open tabs and saved shortcuts.",
    recommendation: "Add a favicon in a supported format and ensure the referenced asset is publicly accessible.",
    verification_steps: ["Open the favicon URL directly.", "Check the link rel and file type in the document head.", "Reload the page with cache disabled and confirm the icon appears in the browser tab."],
  },
  "GEN-06": {
    why_it_matters: "Structured data can help search engines interpret whether a page describes an organisation, product, article or another supported entity. It is optional and should only be added when it accurately describes the page.",
    recommendation: "Add valid JSON-LD only for information that is visibly present and accurate. Do not add fabricated reviews, prices, ratings or business details.",
    verification_steps: ["Identify the page type and the structured-data type that genuinely applies.", "Validate the JSON-LD syntax and required properties.", "Test it with a structured-data validator and keep it aligned with visible page content."],
  },
};

export function getRuleGuidance(ruleId: string, description: string): Guidance {
  return GUIDANCE[ruleId] ?? {
    why_it_matters: description || "This check identified a condition that may affect the experience, privacy or technical reliability of the page.",
    recommendation: "Review the affected element in the browser inspector, confirm whether the finding is relevant to this page, then implement a change appropriate to the site's actual behaviour.",
    verification_steps: ["Locate the affected element or response detail shown in the evidence.", "Compare it with the intended page behaviour and relevant standard.", "Make the change and repeat the scan, then test the page manually."],
  };
}
