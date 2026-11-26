"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AuditResult, AuditFinding } from "@/lib/audit";

type HistoryItem = AuditResult;
const HISTORY_KEY = "regupulse.history.v1";
const CREDIT_KEY = "regupulse.credits.v1";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function StatusPill({ status }: { status: AuditFinding["status"] }) {
  const label = status === "pass" ? "Passed" : status === "warning" ? "Review" : "Action";
  return <span className={"status-pill status-" + status}><i />{label}</span>;
}

export function AuditWorkbench() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [credits, setCredits] = useState(50);
  const [storageMode, setStorageMode] = useState<"local" | "cloud">("local");
  const [founder, setFounder] = useState(false);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) setHistory(JSON.parse(savedHistory) as HistoryItem[]);
      const savedCredits = localStorage.getItem(CREDIT_KEY);
      if (savedCredits) setCredits(Math.max(0, Number(savedCredits) || 0));
    } catch { /* Ignore malformed local preview data. */ }

    fetch("/api/credits", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((data) => {
      if (data?.mode === "cloud") {
        setStorageMode("cloud"); setCredits(data.creditsRemaining); setFounder(Boolean(data.isFounder));
      }
    }).catch(() => undefined);

    fetch("/api/scans", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((data) => {
      if (Array.isArray(data?.scans) && data.scans.length) {
        const saved = data.scans as HistoryItem[]; setHistory(saved); setResult(saved[0]);
      }
    }).catch(() => undefined);
  }, []);

  const passed = useMemo(() => result?.findings.filter((item) => item.status === "pass").length ?? 0, [result]);
  const review = useMemo(() => result?.findings.filter((item) => item.status === "warning").length ?? 0, [result]);
  const action = useMemo(() => result?.findings.filter((item) => item.status === "fail").length ?? 0, [result]);

  async function runAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setResult(null);
    if (!url.trim()) { setMessage("Enter a website address to begin."); return; }
    if (credits <= 0 && storageMode === "local") { setMessage("Your preview credits are used up. Explore a plan to keep scanning."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The review could not be completed.");
      const next = payload.result as AuditResult;
      setResult(next);
      setHistory((current) => {
        const updated = [next, ...current.filter((item) => item.id !== next.id)].slice(0, 8);
        if (storageMode === "local" || payload.mode === "local") localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        return updated;
      });
      if (payload.mode === "cloud") {
        setStorageMode("cloud"); setCredits(payload.creditsRemaining); setFounder(Boolean(payload.isFounder));
      } else {
        setCredits((current) => { const updated = Math.max(0, current - 1); localStorage.setItem(CREDIT_KEY, String(updated)); return updated; });
      }
      setMessage("Review complete. Your findings are ready below.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="workbench">
      <div className="workbench-top">
        <div><div className="workbench-kicker"><span className="live-dot" /> LIVE WEBSITE REVIEW</div><h3>Website review</h3><p>Enter a public HTTPS website to run your checks.</p></div>
        <div className="credit-box"><span>{founder ? "FOUNDING WORKSPACE" : "AVAILABLE CREDITS"}</span><b>{credits}<small> credits</small></b><a href="/pricing">View plans ↗</a></div>
      </div>
      <form className="scan-form" onSubmit={runAudit}>
        <label htmlFor="scan-url">Website URL</label>
        <div className="scan-input-row"><span className="input-globe" aria-hidden="true">◎</span><input id="scan-url" type="url" inputMode="url" placeholder="https://example.com" value={url} onChange={(event) => setUrl(event.target.value)} required /><button type="submit" className="button button-dark scan-button" disabled={loading || (credits <= 0 && storageMode === "local")}>{loading ? <><span className="spinner" /> Checking…</> : <>Run check <span>↗</span></>}</button></div>
        <div className="scan-form-foot"><span>HTTPS websites only · Public pages · One credit per completed scan</span><span className="secure-note">⌑ Secure request</span></div>
      </form>
      {message && <p className={result ? "inline-message success-message" : "inline-message"} role="status">{message}</p>}

      {result ? (
        <section className="result-panel" aria-live="polite">
          <div className="result-heading"><div><span className="result-label">LATEST REPORT</span><h3>{result.host}</h3><p>{formatDate(result.createdAt)} <span>·</span> {result.finalUrl}</p></div><div className="score-block"><strong>{result.score}</strong><span>/100</span><small>Readiness</small></div></div>
          <div className="score-track"><span style={{ width: result.score + "%" }} /></div>
          <div className="result-stats"><div><b className="green-text">{passed}</b><span>Passed</span></div><div><b className="amber-text">{review}</b><span>Review</span></div><div><b className="red-text">{action}</b><span>Action needed</span></div></div>
          <div className="findings-head"><div><h4>Findings</h4><p>Work through the items below to improve your result.</p></div><span>{result.findings.length} checks</span></div>
          <div className="finding-list">{result.findings.map((finding) => <article className="finding-row" key={finding.id}><div className={"finding-symbol symbol-" + finding.status}>{finding.status === "pass" ? "✓" : finding.status === "warning" ? "!" : "×"}</div><div className="finding-copy"><div className="finding-title-row"><h5>{finding.title}</h5><StatusPill status={finding.status} /></div><p>{finding.detail}</p>{finding.recommendation && <div className="recommendation"><b>Recommended next step</b><span>{finding.recommendation}</span></div>}</div><span className="finding-weight">{finding.category}</span></article>)}</div>
          <p className="report-disclaimer">This automated review identifies common technical signals. It is not legal advice, a penetration test or a formal compliance certification.</p>
        </section>
      ) : !loading ? <div className="workbench-empty"><div className="empty-mark">↗</div><div><b>Your report will appear here</b><span>Run a website check to get your first set of findings.</span></div></div> : null}

      <div className="history-strip"><div className="history-title"><span>RECENT REVIEWS</span><small>{history.length ? history.length + " saved" : "No reviews yet"}</small></div>
        {history.length ? history.slice(0, 4).map((item) => <button className="history-item" type="button" key={item.id} onClick={() => setResult(item)}><span className="history-score">{item.score}</span><span className="history-site">{item.host}<small>{formatDate(item.createdAt)}</small></span><span className="history-arrow">↗</span></button>) : <p className="history-empty">Your recent websites will be listed here.</p>}
      </div>
    </div>
  );
}