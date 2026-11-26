"use client";
import { useState } from "react";
export function PricingClient({ plan, name, featured }: { plan: string; name: string; featured: boolean }) {
  const [loading, setLoading] = useState(false), [message, setMessage] = useState("");
  async function choosePlan() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout is not available right now.");
      window.location.assign(data.checkoutUrl);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Checkout could not be started."); }
    finally { setLoading(false); }
  }
  return <div className="price-action-wrap"><button type="button" className={featured ? "button button-dark price-action" : "button button-outline price-action"} onClick={choosePlan} disabled={loading}>{loading ? "Connecting…" : "Choose " + name + " ↗"}</button>{message && <p className="billing-note" role="status">{message}</p>}</div>;
}