// src/app/dashboard/components/StrategyPreviewSection.tsx
"use client";

import { StrategySummaryCard } from "@/components/StrategySummaryCard";
import { WeeklyPlanCard } from "@/components/WeeklyPlanCard";
import { NextPostCard } from "@/components/NextPostCard";

type StrategyPreviewSectionProps = {
  strategy: any; // internal-only type; computeStrategy output
};

export function StrategyPreviewSection({
  strategy,
}: StrategyPreviewSectionProps) {
  return (
    <section className="mb-12 space-y-8">
      <StrategySummaryCard strategy={strategy} />
      <WeeklyPlanCard plans={strategy.weeklyPlans} />
      <NextPostCard nextPost={strategy.nextPost} />
    </section>
  );
}
