import type { Metadata } from "next";
import { PricingClient } from "@/components/pricing-client";
export const metadata: Metadata = { title: "Plans & pricing — ReguPulse", description: "Straightforward monthly plans for website reviews." };
const plans = [
  { id: "starter", name: "Starter", price: "₹199", audience: "For personal websites and solo founders", scans: "150 scan credits", features: ["150 website reviews each month", "Accessibility and privacy checks", "Security-header review", "Saved report history"] },
  { id: "growth", name: "Growth", price: "₹499", audience: "For growing teams and small businesses", scans: "600 scan credits", featured: true, features: ["600 website reviews each month", "Everything in Starter", "Priority report history", "Ideal for multiple websites"] },
  { id: "agency", name: "Agency", price: "₹1,499", audience: "For freelancers and client-facing teams", scans: "2,500 scan credits", features: ["2,500 website reviews each month", "Everything in Growth", "High-volume review allowance", "For multi-client workflows"] }
];
export default function PricingPage() {
  return <main className="pricing-page">
    <section className="pricing-hero shell"><div className="eyebrow"><span className="eyebrow-dot" /> SIMPLE, INDIA-FIRST PRICING</div><h1>Useful tools.<br /><em>Fair monthly plans.</em></h1><p>Start with complimentary credits. Upgrade only when website reviews become part of your regular workflow.</p>
      <div className="free-credit-note"><span>✳</span><div><b>Launch workspace bonus</b><small>The first workspace in a new cloud deployment receives 100 credits. New workspaces receive 50 credits.</small></div></div>
    </section>
    <section className="shell pricing-content"><div className="pricing-grid">
      {plans.map((plan) => <article className={"price-card" + (plan.featured ? " price-card-featured" : "")} key={plan.id}>
        {plan.featured && <span className="popular-label">MOST POPULAR</span>}
        <span className="price-name">{plan.name}</span><p className="price-audience">{plan.audience}</p>
        <div className="price-amount">{plan.price}<small>/ month</small></div><div className="price-scans">{plan.scans}</div>
        <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
        <PricingClient plan={plan.id} name={plan.name} featured={Boolean(plan.featured)} />
      </article>)}
    </div><p className="pricing-footnote">Prices are shown in INR. Paid plans require an active Razorpay subscription and a configured cloud workspace. GST, if applicable, is handled at checkout.</p></section>
    <section className="shell pricing-faq"><div><span className="eyebrow">GOOD TO KNOW</span><h2>Start small.<br /><em>Scale when ready.</em></h2></div><div className="faq-list">
      <article><h3>Do I need an account?</h3><p>No account is required for this launch build. Your workspace is held in a private browser cookie. Account authentication will be added in a later release.</p></article>
      <article><h3>What does one credit cover?</h3><p>One completed website review uses one credit. A failed or blocked request does not consume a cloud credit.</p></article>
      <article><h3>Can I cancel?</h3><p>Subscriptions are managed through the Razorpay subscription flow. Account-based cancellation controls will be added with authentication.</p></article>
    </div></section>
  </main>;
}