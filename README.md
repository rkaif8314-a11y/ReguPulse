# ReguPulse

ReguPulse is a full-stack website review workbench for accessibility, privacy, security and general website quality. It uses deterministic DOM, response-header and source-file checks.

## Product functionality

- **30 website checks** across accessibility, privacy, security and general page quality.
- Detailed reports with an overall score, four pillar scores, severity, rule references, affected page snippets, why each finding matters, a recommended change and manual verification steps.
- Report pages can be opened from the workspace, printed or saved as PDF through the browser print dialogue, and downloaded as JSON.
- **Source-file inspector** for HTML, CSS, JavaScript, TypeScript, JSON, Markdown and TXT files up to 2 MB. It reports line-level evidence, recommendations, verification steps and suggested rewrites. This tool costs 5 credits.
- A URL scan costs 1 credit. Failed cloud scans return the credit.
- Guest workspaces; no login or sign-up is required at this stage. A private HTTP-only browser cookie identifies the workspace.
- Firebase Admin + Cloud Firestore for private report history, credits, file-review history and monitored sites. If Firebase credentials are not configured, the website and scanner use browser-local preview mode.
- India-first monthly plans through Razorpay: Starter ₹199, Growth ₹499 and Agency ₹1,499.
- Optional weekly reviews for saved websites using Vercel Cron.

## Launch credits and plans

The first workspace created in a new Firestore database receives 100 launch credits. Each later workspace receives 50 credits. Paid monthly allowances are Starter 150, Growth 600 and Agency 2,500 credits per billing cycle. A scan costs one credit; a source-file inspection costs five credits.

## Local development

Requirements: Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without cloud credentials, the site uses local browser credits and local report history. Cloud saving and paid checkout require the setup below.

## Firebase / Firestore setup

1. Create a Firebase project and enable Cloud Firestore.
2. Create a server service-account credential in Firebase Project Settings → Service Accounts. Do not enable Firebase Authentication for this version; login has intentionally been deferred.
3. Add these server-only variables to `.env.local` and Vercel: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
4. Deploy the security rules and indexes:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

The Firestore rules deny direct browser access to every collection. The Next.js server uses Firebase Admin to scope each scan and file review to the private guest workspace. Never put the service-account private key in a `NEXT_PUBLIC_` variable or commit it to Git.

Collections created by the app include `guest_workspaces`, `system`, `scans`, `file_reviews` and `monitored_sites`.

## Razorpay subscriptions

1. Create three monthly subscription plans in the Razorpay Dashboard with amounts ₹199, ₹499 and ₹1,499.
2. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_STARTER`, `RAZORPAY_PLAN_GROWTH` and `RAZORPAY_PLAN_AGENCY` to the environment.
3. Add a Razorpay webhook endpoint at `/api/webhooks/razorpay` and enable `subscription.activated`, `subscription.charged`, `subscription.cancelled` and `subscription.halted`.
4. Test the full subscription lifecycle in Razorpay test mode before accepting live payments.

The application does not contain real payment keys or plan IDs. Checkout remains safely disabled until the site owner supplies them.

## Vercel deployment

Connect `rkaif8314-a11y/ReguPulse` as a Next.js project with the repository root as the root directory. Use `npm install` and `npm run build`. Add the Firebase Admin and Razorpay environment variables before turning on cloud credits and subscriptions. `vercel.json` configures a weekly review cron; add `CRON_SECRET` to production environment variables.

## Important limitations

- This is a static HTML/source and response-header review, not a full browser automation or authenticated application test. Client-rendered content, post-interaction requests and some runtime behaviour may not be visible.
- A passing check is not a legal opinion, security audit, accessibility certification or guarantee of compliance.
- Suggested file rewrites are deterministic templates; they do not overwrite the uploaded source. Review and test every suggestion before deploying it.
- Guest workspaces are a launch-stage account model. Clearing browser cookies creates a new workspace. Authentication, account recovery and cross-device access can be added later.
