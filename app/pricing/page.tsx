import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { PRICING_PLANS } from "@/lib/pricing";
import { PricingActions } from "@/components/pricing-actions";

export const metadata: Metadata = {
  title: "Plans & pricing — ReguPulse",
  description: "Straightforward India-first plans for website and source-file reviews.",
};

export default function PricingPage() {
  return <main className="min-h-screen"><Navbar /><section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">Simple India-first pricing</p>
    <h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>Useful website reviews.<br/><em className="text-emerald-800">Fair monthly plans.</em></h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">Start without creating an account. A website scan costs one credit. The source-file inspector costs five credits and returns findings, checks and rewrite suggestions.</p>
    <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:flex sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-emerald-950">Launch workspace bonus</p><p className="mt-1 max-w-xl text-xs leading-6 text-emerald-900">The first workspace created in a fresh database receives 100 credits. Every later new workspace receives 50 credits.</p></div><Link href="/#scanner" className="mt-4 inline-flex rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white sm:mt-0">Start with free credits ↗</Link></div>
    <div className="mt-9 grid gap-4 md:grid-cols-3">{[PRICING_PLANS.starter,PRICING_PLANS.growth,PRICING_PLANS.agency].map((plan)=><article key={plan.id} className={`flex flex-col rounded-xl border bg-white p-6 ${plan.highlighted ? "border-emerald-700 ring-1 ring-emerald-700" : "border-stone-200"}`}>{plan.highlighted&&<span className="mb-3 w-fit rounded-full bg-emerald-900 px-2.5 py-1 font-mono text-[9px] font-semibold tracking-wider text-white">POPULAR</span>}<h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2><p className="mt-1 text-xs text-stone-500">{plan.tagline}</p><div className="mt-5 text-3xl font-bold tracking-tight text-slate-900">{plan.inrLabel}</div><p className="mt-2 rounded-md bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-700">{plan.monthlyCredits.toLocaleString("en-IN")} credits per billing cycle</p><ul className="mt-5 flex-1 space-y-3 text-xs leading-5 text-stone-600">{plan.features.map((feature)=><li key={feature} className="flex gap-2"><span className="text-emerald-700">✓</span><span>{feature}</span></li>)}</ul><PricingActions plan={plan.id} name={plan.name} featured={Boolean(plan.highlighted)} /></article>)}</div>
    <div className="mt-9 grid gap-5 border-t border-stone-200 pt-7 sm:grid-cols-3"><div><h3 className="text-sm font-semibold">No account required</h3><p className="mt-2 text-xs leading-6 text-stone-500">A private browser workspace keeps your reports separate. Account registration is intentionally deferred.</p></div><div><h3 className="text-sm font-semibold">Credits are transparent</h3><p className="mt-2 text-xs leading-6 text-stone-500">One credit per URL scan. Five credits per uploaded file review. Failed scans do not consume cloud credits.</p></div><div><h3 className="text-sm font-semibold">India-ready checkout</h3><p className="mt-2 text-xs leading-6 text-stone-500">Subscriptions use Razorpay in INR. Checkout becomes active once the site owner configures the plan IDs and webhook.</p></div></div>
  </section></main>;
}
