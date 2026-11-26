export type PlanTier = "free" | "starter" | "growth" | "agency";
export type RiskLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
export type CompliancePillar = "ACCESSIBILITY" | "PRIVACY" | "SECURITY" | "GENERAL";
export type RuleSeverity = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

export interface ComplianceIssue {
  rule_id: string;
  pillar: CompliancePillar;
  severity: RuleSeverity;
  title: string;
  legal_reference: string;
  description: string;
  affected_snippets: string[];
  points_deducted: number;
  why_it_matters: string;
  recommendation: string;
  verification_steps: string[];
}

export interface DetectedTech {
  analytics: string[];
  consent_platforms: string[];
  cms_or_framework: string[];
  security_headers: {
    hsts: boolean;
    csp: boolean;
    x_content_type_options: boolean;
    x_frame_options: boolean;
  };
}

export interface PassedCheck {
  rule_id: string;
  pillar: CompliancePillar;
  title: string;
}

export interface ScanResult {
  target_url: string;
  normalized_domain: string;
  overall_score: number;
  accessibility_score: number;
  privacy_score: number;
  security_score: number;
  general_score: number;
  risk_level: RiskLevel;
  detected_tech: DetectedTech;
  issues: ComplianceIssue[];
  passed_checks: PassedCheck[];
  scan_duration_ms: number;
  total_rules_checked: number;
  passed_rules_count: number;
  created_at: string;
}

export interface GuestWorkspaceDoc {
  id: string;
  credits_remaining: number;
  plan_tier: PlanTier;
  is_founder: boolean;
  subscription_status: "inactive" | "active" | "halted" | "cancelled";
  razorpay_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonitoredSiteDoc {
  id: string;
  workspace_id: string;
  domain: string;
  url: string;
  slug: string;
  monitoring_enabled: boolean;
  last_score: number | null;
  last_scanned_at: string | null;
  badge_verified: boolean;
  created_at: string;
}

export interface ScanDoc extends ScanResult {
  id: string;
  workspace_id: string;
  site_id: string | null;
}

export interface FileReviewFinding {
  id: string;
  category: "Accessibility" | "Privacy" | "Security" | "SEO" | "Code quality" | "Content";
  severity: RuleSeverity;
  title: string;
  line: number | null;
  evidence: string;
  why_it_matters: string;
  recommendation: string;
  verification_steps: string[];
  suggested_rewrite: string | null;
}

export interface FileReviewResult {
  id: string;
  filename: string;
  file_type: string;
  score: number;
  findings: FileReviewFinding[];
  summary: string;
  created_at: string;
}
