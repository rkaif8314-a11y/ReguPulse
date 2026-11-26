import Link from "next/link";
import { AuditWorkbench } from "@/components/audit-workbench";

const pillars = [
  { number: "01", title: "Accessibility", body: "Catch common barriers in structure, labels, language and image alternatives." },
  { number: "02", title: "Privacy clarity", body: "Check for visible privacy information and clear handling notices around forms." },
  { number: "03", title: "Web security", body: "Review essential response headers and transport protections." },
  { number: "04", title: "Clear actions", body: "Every finding explains why it matters and gives your team a concrete next step." }
];

export default function HomePage() {
  return (
    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> WEBSITE TRUST, WITHOUT THE GUESSWORK</div>
          <h1>Compliance you can <em>actually act on.</em></h1>
          <p className="hero-description">A clearer way to review your website. Find practical issues across accessibility, privacy and security — then work through the fixes one by one.</p>
          <div className="hero-actions"><a className="button button-dark" href="#scanner">Run a free check <span>↗</span></a><a className="text-link" href="#how-it-works">See how it works <span>↓</span></a></div>
          <div className="hero-proof"><span className="proof-check">✓</span> No account needed <span className="proof-separator">·</span> 50 launch credits <span className="proof-separator">·</span> One credit per scan</div>
        </div>
        <div className="hero-art" aria-label="Illustration of a website review dashboard">
          <div className="art-glow" />
          <div className="art-window">
            <div className="art-window-top"><span /><span /><span /><b>regupulse / report</b></div>
            <div className="art-window-content">
              <div className="art-label">READINESS SNAPSHOT</div>
              <div className="art-score-row"><strong>86</strong><span>/ 100<br />Readiness score</span></div>
              <div className="art-line"><i style={{ width: "86%" }} /></div>
              <div className="art-mini-grid"><div><b>09</b><small>Passed</small></div><div><b>03</b><small>Review</small></div><div><b>01</b><small>Action</small></div></div>
              <div className="art-finding"><span className="finding-dot amber" /><div><b>Cookie preference control</b><small>Make choices easy to find</small></div><span>›</span></div>
              <div className="art-finding"><span className="finding-dot green" /><div><b>Document language</b><small>Language attribute detected</small></div><span>✓</span></div>
            </div>
          </div>
          <div className="floating-stamp"><span>↗</span><div><b>Clear next steps</b><small>Not just a score</small></div></div>
        </div>
      </section>

      <section className="trust-strip"><div className="shell trust-inner"><span>MADE FOR THE PEOPLE BUILDING THE WEB</span><div><b>Founders</b><b>Independent teams</b><b>Agencies</b><b>Growing businesses</b></div></div></section>

      <section id="scanner" className="shell workspace-section">
        <div className="section-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h2>Start with a single URL.</h2></div><p>Run a live review and get an ordered list of what to improve. No account required for the launch preview.</p></div>
        <AuditWorkbench />
      </section>

      <section id="coverage" className="coverage-section">
        <div className="shell">
          <div className="section-heading section-heading-light"><div><div className="eyebrow eyebrow-light">WHAT WE LOOK AT</div><h2>Four useful lenses.<br /><em>One clearer picture.</em></h2></div><p>ReguPulse focuses on practical signals that teams can check and improve without getting buried in legal jargon.</p></div>
          <div className="pillar-grid">{pillars.map((item) => <article className={"pillar-card" + (item.number === "04" ? " pillar-card-accent" : "")} key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.body}</p><div className="pillar-arrow">↗</div></article>)}</div>
        </div>
      </section>

      <section id="how-it-works" className="shell steps-section">
        <div className="section-heading"><div><div className="eyebrow">A SIMPLE ROUTINE</div><h2>From URL to action plan.</h2></div><Link href="/pricing" className="text-link">Explore plans <span>↗</span></Link></div>
        <div className="steps-grid">
          <div className="step"><span>01</span><h3>Enter your website</h3><p>Start with the public page you want to review.</p></div>
          <div className="step"><span>02</span><h3>Review the findings</h3><p>See checks grouped by result and impact.</p></div>
          <div className="step"><span>03</span><h3>Make improvements</h3><p>Use the recommendations as a practical worklist.</p></div>
        </div>
        <div className="bottom-cta"><div><span>READY WHEN YOU ARE</span><h2>Make your next website review a better one.</h2></div><a className="button button-light" href="#scanner">Run your first check ↗</a></div>
      </section>
    </main>
  );
}