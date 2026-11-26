# ReguPulse

A practical website compliance workbench for founders, small teams and agencies. ReguPulse runs deterministic checks for accessibility, privacy disclosures, cookie transparency and baseline web security. Its checks are practical signals and do not claim to certify legal compliance.

## Product

- URL-based website checks with a server-side HTML fetcher.
- Accessibility review: document language, image alternative text, form labels and meaningful links.
- Privacy and cookie transparency checks.
- Baseline security-header checks.
- Clear findings with severity, recommendations and a weighted readiness score.
- Guest workspaces with launch credits.
- Browser-local scan history when cloud storage is not configured; Supabase persistence when configured.
- India-first monthly plans: Starter ₹199, Growth ₹499 and Agency ₹1,499.
- Razorpay recurring-subscription endpoints and signed webhook handling.

The first workspace in a fresh Supabase deployment receives 100 credits. Each later workspace receives 50 credits. One completed scan consumes one credit. Paid plan allowances are replenished on successful subscription charges.

## Authentication status

Authentication is intentionally deferred. This build uses a private HTTP-only guest workspace cookie and does not ask visitors to create an account. A guest cookie is not a substitute for account authentication or enterprise identity controls.

## Local setup

1. Install Node.js 20.9 or newer.
2. Run npm install.
3. Copy .env.example to .env.local.
4. Run npm run dev.
5. Open http://localhost:3000.

The scanner and pricing pages work without external credentials. Without Supabase, scans and credits use browser-local preview mode. Add Supabase credentials and run the SQL migration to enable shared cloud storage and server-managed credits.

## Supabase setup

1. Create a Supabase project.
2. Add NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and a strong GUEST_HASH_SECRET to your local environment and Vercel.
3. Run supabase/migrations/20261127000000_initial_schema.sql in the Supabase SQL Editor.
4. Confirm /api/health reports database storage as configured.

The service role key is server-only. It must never be placed in a NEXT_PUBLIC_ variable or committed to Git.

## Razorpay setup

Create monthly subscription plans in the Razorpay Dashboard with these exact amounts: ₹199, ₹499 and ₹1,499. Add the corresponding plan IDs and test/live credentials to your environment variables. Configure a webhook at /api/billing/webhook and subscribe to subscription.activated, subscription.charged, subscription.cancelled and subscription.halted.

Checkout stays disabled until Supabase and the Razorpay plan IDs are configured. Test the full subscription lifecycle in Razorpay test mode before accepting live payments.

## Deployment

The repository is configured for Next.js on Vercel. Connect this GitHub repository to a Vercel project and deploy the main branch. Add environment variables in Vercel before enabling cloud credits or payments.

The retired static prototype was removed from the active app so the repository contains only the current product build.

## Security and limitations

- URL fetching is HTTPS-only, follows redirects manually, resolves DNS, rejects private/reserved IP ranges and pins the resolved addresses for outbound requests.
- Responses are restricted to HTML and a bounded response size.
- Checks are indicators, not legal advice, a penetration test, accessibility certification or a guarantee of GDPR, DPDP or WCAG compliance.
- Anonymous workspaces are suitable for a launch preview. Add authentication, account recovery, stronger abuse controls, team permissions and formal retention policies before broad commercial launch.
- Add monitoring, rate limits and operational alerting before production billing.