import Link from "next/link";
import { Activity, CheckCircle2, FileCode2, Globe2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ScannerForm } from "@/components/scanner-form";
import { FileReviewTool } from "@/components/file-review-tool";
import { PRICING_PLANS } from "@/lib/pricing";

const pillars = [
  { number: "01", title: "Accessibility", body: "Document language, image alternatives, form labels, focus, headings, landmarks, zoom, links and interactive controls." },
  { number: "02", title: "Privacy", body: "Privacy notices, cookie choices, third-party tracking, service terms, refunds and contact details." },
  { number: "03", title: "Security", body: "HTTPS, HSTS, response headers, mixed content, cookie attributes and safer external links." },
  { number: "04", title: "General site quality", body: "Page titles, descriptions, canonical URLs, sharing metadata, site icons and structured page identity." },
];

export default function LandingPage() {
  return <main className="min-h-screen">
    <Navbar />
    <section className="border-b border-stone-200 bg-white px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900"><span className="h-1.5 w-1.5 rounded-full bg-emerald-700" /> 30-rule website review workbench</div>
            <h1 className="mt-6 max-w-3xl text-5xl font-normal leading-[1.04] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.2rem]" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>Understand what your website needs to <em className="text-emerald-800">do better.</em></h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">Review public websites across accessibility, privacy, security and general site quality. Get clear evidence, why each issue matters, what to change and how to verify the fix.</p>
            <div className="mt-7 flex flex-wrap gap-3"><a href="#scanner" className="rounded-lg bg-slate-900 px-5 py-3 text-xs font-semibold text-white hover:bg-emerald-900">Run a free website review ↗</a><Link href="/pricing" className="rounded-lg border border-stone-300 px-5 py-3 text-xs font-semibold text-slate-800 hover:bg-stone-50">View India pricing</Link></div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-500"><span>✓ No account needed</span><span>✓ 100 launch credits for first workspace</span><span>✓ Print or save reports as PDF</span></div>
          </div>
          <div className="relative rounded-2xl border border-stone-200 bg-[#F7F7F3] p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between"><span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Example report snapshot</span><ShieldCheck className="h-5 w-5 text-emerald-800" /></div>
            <div className="mt-7 flex items-end gap-3"><span className="text-7xl font-normal leading-none text-emerald-900" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>82</span><span className="pb-1 text-xs text-stone-500">/ 100<br/>Readiness score</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full w-[82%] rounded-full bg-emerald-800" /></div>
            <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{name:"Accessibility",value:88},{name:"Privacy",value:76},{name:"Security",value:80},{name:"General",value:84}].map((x) => <div key={x.name} className="rounded-lg border border-stone-200 bg-white p-3"><b className="text-xl text-slate-900">{x.value}</b><small className="mt-1 block text-xs text-stone-500">{x.name}</small></div>)}</div>
            <div className="mt-5 space-y-2">{[{title:"Form control needs a label",status:"HIGH",tone:"bg-red-50 text-red-800"},{title:"Privacy notice not found",status:"MODERATE",tone:"bg-amber-50 text-amber-800"},{title:"Page title detected",status:"PASSED",tone:"bg-emerald-50 text-emerald-800"}].map((item) => <div key={item.title} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-3"><span className="text-xs text-slate-800">{item.title}</span><span className={`rounded-full px-2 py-1 font-mono text-xs font-semibold ${item.tone}`}>{item.status}</span></div>)}</div>
            <p className="mt-4 text-xs text-stone-400">Illustrative example — not a result for your website.</p>
          </div>
        </div>
        <div id="scanner" className="mt-16 border-t border-stone-200 pt-9"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Website scanner</p><h2 className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>Start with a public URL.</h2><p className="mt-1 text-xs text-stone-500">One credit per completed scan. Full report details are included.</p></div><div className="flex items-center gap-2 text-xs text-stone-500"><LockKeyhole className="h-3.5 w-3.5" /> Private guest workspace</div></div><ScannerForm /></div>
      </div>
    </section>

    <section id="coverage" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="max-w-2xl"><p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Broad review, actionable detail</p><h2 className="mt-3 text-3xl font-normal leading-tight text-slate-900 sm:text-4xl" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>Four areas. One understandable assessment.</h2><p className="mt-3 text-sm leading-7 text-stone-600">Each failed check includes evidence from the page, its impact, a recommended change and manual steps to confirm that the improvement works.</p></div>
      <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{pillars.map((p) => <article key={p.number} className="rounded-xl border border-stone-200 bg-white p-5"><span className="font-mono text-xs font-semibold text-emerald-800">{p.number}</span><h3 className="mt-6 text-lg font-medium text-slate-900" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>{p.title}</h3><p className="mt-2 text-xs leading-6 text-stone-600">{p.body}</p></article>)}</div>
      <div className="mt-7 grid gap-3 md:grid-cols-3">{[{icon:Activity,title:"30 practical checks",body:"A deterministic review of page markup and response headers — no opaque score-only output."},{icon:FileCode2,title:"Source-file inspection",body:"Upload HTML, CSS, JS, TypeScript, JSON, Markdown or TXT for an additional five-credit review."},{icon:CheckCircle2,title:"Detailed verification",body:"Know where an issue occurs, what to change and how to check the fix in the browser."}].map((x) => <div key={x.title} className="flex gap-3 rounded-xl bg-[#F0F1EC] p-5"><x.icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800"/><div><h3 className="text-sm font-semibold text-slate-900">{x.title}</h3><p className="mt-1 text-xs leading-6 text-stone-600">{x.body}</p></div></div>)}</div>
    </section>

    <section id="file-tool" className="border-y border-stone-200 bg-white px-4 py-16 sm:px-6 lg:py-20"><div className="mx-auto max-w-6xl"><div className="mb-7 max-w-2xl"><p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Five-credit tool</p><h2 className="mt-3 text-3xl font-normal text-slate-900 sm:text-4xl" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>Inspect your own code or content.</h2><p className="mt-3 text-sm leading-7 text-stone-600">Upload a file to inspect common issues, view rewrite suggestions, learn how to verify each change and download the detailed review notes.</p></div><FileReviewTool /></div></section>

    <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Transparent pricing</p><h2 className="mt-3 text-3xl font-normal text-slate-900" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>Start free. Upgrade when ready.</h2></div><Link href="/pricing" className="text-xs font-semibold text-emerald-900">Compare all plans ↗</Link></div><div className="mt-8 grid gap-3 md:grid-cols-3">{[PRICING_PLANS.starter,PRICING_PLANS.growth,PRICING_PLANS.agency].map((plan) => <article key={plan.id} className={`rounded-xl border bg-white p-5 ${plan.highlighted ? "border-emerald-700" : "border-stone-200"}`}><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>{plan.highlighted && <span className="rounded-full bg-emerald-900 px-2 py-1 text-xs font-semibold text-white">POPULAR</span>}</div><p className="mt-1 text-xs text-stone-500">{plan.tagline}</p><p className="mt-5 text-2xl font-bold text-slate-900">{plan.inrLabel}</p><p className="mt-1 text-xs text-emerald-800">{plan.monthlyCredits.toLocaleString("en-IN")} credits / cycle</p></article>)}</div>
    </section>
    <footer className="border-t border-stone-200 bg-[#F0F1EC] px-4 py-7 sm:px-6"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 text-xs text-stone-500 sm:flex-row"><span>© {new Date().getFullYear()} ReguPulse</span><span>Automated screening support only. It is not legal advice or formal certification.</span></div></footer>
  </main>;
}
