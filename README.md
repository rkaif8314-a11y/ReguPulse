# ReguPulse

**Website Compliance Audit & Remediation Workbench**

ReguPulse is a browser-based demo for reviewing website compliance signals across AI transparency, accessibility, and privacy. It includes sample scan profiles, an audit dossier, remediation snippets, monitored-domain UI, and a verification-certificate view.

## Run locally

1. Clone or download this repository.
2. Open `index.html` in a modern browser.

No build step is required. The page loads Tailwind CSS, Lucide icons, and Google Fonts from CDNs, so an internet connection is needed for those external assets.

## Important demo limitations

- Scan results are based on hard-coded sample profiles; this is not a live website crawler or legal compliance determination.
- Monitoring, checkout, payment confirmation, certificates, and share/badge URLs are front-end demonstrations. They are not connected to a backend, payment provider, scheduled job, or verification API.
- Do not rely on the displayed scores as legal advice or proof of compliance.

## Tech

- HTML
- Vanilla JavaScript
- Tailwind CSS (CDN)
- Lucide icons (CDN)
