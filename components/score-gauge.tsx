import type { RiskLevel } from "@/lib/types";

interface ScoreGaugeProps {
  score: number;
  riskLevel: RiskLevel;
}

export function ScoreGauge({ score, riskLevel }: ScoreGaugeProps) {
  const scoreColor =
    score >= 88
      ? "text-emerald-700"
      : score >= 70
      ? "text-amber-700"
      : "text-red-700";

  const pillClass =
    riskLevel === "LOW"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : riskLevel === "MODERATE"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className="flex flex-col justify-between">
      <span className="font-mono text-[11px] uppercase text-stone-500">
        Overall Score
      </span>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`tabular-nums text-4xl font-bold ${scoreColor}`}>
          {score}
        </span>
        <span className="font-mono text-xs text-stone-400">/ 100</span>
      </div>
      <span
        className={`mt-3 w-fit rounded border px-2 py-0.5 font-mono text-[11px] font-semibold ${pillClass}`}
      >
        {riskLevel} RISK
      </span>
    </div>
  );
}
