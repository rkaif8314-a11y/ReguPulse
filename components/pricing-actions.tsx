"use client";
import { useState } from "react";

export function PricingActions({ plan, name, featured }: { plan: string; name: string; featured: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/checkout/razorpay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || "Checkout could not be started.");
      window.location.assign(data.checkoutUrl);
    } catch (err) { setError(err instanceof Error ? err.message : "Checkout could not be started."); setLoading(false); }
  }
  return <div className="mt-6">
    <button onClick={start} disabled={loading} className={`w-full rounded-lg px-4 py-3 text-xs font-semibold transition ${featured ? "bg-emerald-900 text-white hover:bg-emerald-800" : "border border-stone-300 bg-white text-slate-900 hover:bg-stone-50"}`}>{loading ? "Connecting to Razorpay…" : `Choose ${name} ↗`}</button>
    {error && <p role="status" className="mt-2 rounded-md bg-amber-50 p-2 text-[11px] leading-5 text-amber-900">{error}</p>}
  </div>;
}
