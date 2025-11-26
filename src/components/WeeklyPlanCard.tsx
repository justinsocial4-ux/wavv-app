"use client";

import { WeeklyContentPlan } from "@/lib/creator/types";
import { platformLabel } from "@/lib/strategy/uiHelpers";

type Props = {
  plans: WeeklyContentPlan[];
};

export function WeeklyPlanCard({ plans }: Props) {
  if (!plans || plans.length === 0) return null;

  return (
    <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
        This week&apos;s content plan
      </h2>
      <p className="mt-2 text-xs text-zinc-500">
        Recommended baseline cadence and focus by platform. This is your starting
        point, not a prison.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.platform}
            className="flex flex-col rounded-2xl bg-zinc-900/80 p-4 text-xs text-zinc-200"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                {platformLabel(plan.platform)}
              </span>
              <span className="rounded-full bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-100">
                {plan.postsPerWeek} posts/week
              </span>
            </div>

            <div className="mt-3">
              <p className="text-[11px] font-semibold text-zinc-400">
                Pillars to hit
              </p>
              <p className="mt-1 text-[11px] text-zinc-200">
                {plan.pillarsToHit.map((p) => humanizePillar(p)).join(", ")}
              </p>
            </div>

            <div className="mt-3">
              <p className="text-[11px] font-semibold text-zinc-400">
                Content types
              </p>
              <ul className="mt-1 space-y-1">
                {plan.contentTypes.map((type) => (
                  <li key={type} className="text-[11px] text-zinc-200">
                    • {type}
                  </li>
                ))}
              </ul>
            </div>

            {plan.notes && (
              <p className="mt-3 text-[11px] text-zinc-500">{plan.notes}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function humanizePillar(pillar: string): string {
  return pillar.replace("_", " ");
}
