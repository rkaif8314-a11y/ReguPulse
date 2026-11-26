import type { PlanTier } from "@/lib/types";

export interface PricingPlanConfig {
  id: PlanTier;
  name: string;
  tagline: string;
  inrPaise: number;
  inrLabel: string;
  interval: "month" | "free";
  monthlyCredits: number;
  maxMonitoredSites: number;
  features: string[];
  highlighted?: boolean;
}

export const PRICING_PLANS: Record<PlanTier, PricingPlanConfig> = {
  free: {
    id: "free", name: "Free", tagline: "Try the complete review workspace", inrPaise: 0, inrLabel: "₹0", interval: "free",
    monthlyCredits: 50, maxMonitoredSites: 1,
    features: ["100 launch credits for the first workspace; 50 for later workspaces", "30 website checks per scan", "Detailed issue evidence and fix guidance", "Browser-based report printing and history", "File inspector available for 5 credits"],
  },
  starter: {
    id: "starter", name: "Starter", tagline: "For personal sites and independent builders", inrPaise: 19900, inrLabel: "₹199 / month", interval: "month",
    monthlyCredits: 150, maxMonitoredSites: 1,
    features: ["150 credits each billing cycle", "All 30 website checks", "Detailed downloadable reports", "1 monitored website", "File inspection and rewrite suggestions"],
  },
  growth: {
    id: "growth", name: "Growth", tagline: "For growing teams and small businesses", inrPaise: 49900, inrLabel: "₹499 / month", interval: "month",
    monthlyCredits: 600, maxMonitoredSites: 3, highlighted: true,
    features: ["600 credits each billing cycle", "Everything in Starter", "Up to 3 monitored websites", "Weekly re-check schedule", "Website and source-file reviews"],
  },
  agency: {
    id: "agency", name: "Agency", tagline: "For freelancers and client-facing teams", inrPaise: 149900, inrLabel: "₹1,499 / month", interval: "month",
    monthlyCredits: 2500, maxMonitoredSites: 10,
    features: ["2,500 credits each billing cycle", "Everything in Growth", "Up to 10 monitored websites", "High-volume client review workflow", "Shareable verification pages and badges"],
  },
};

export function getMaxSitesForPlan(plan: PlanTier) {
  return PRICING_PLANS[plan].maxMonitoredSites;
}
