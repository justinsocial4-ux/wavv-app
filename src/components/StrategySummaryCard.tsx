"use client";

import { ComputedStrategy } from "@/lib/strategy/computeStrategy";
import { platformLabel } from "@/lib/strategy/uiHelpers";

type Props = {
  strategy: ComputedStrategy;
};

export function StrategySummaryCard({ strategy }: Props) {
  const { narrativeSummary, primaryPlatform } = strategy;

  return (
    <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
        Strategy overview
      </h2>
      <p className="mt-2 text-xs text-zinc-500">
        How Wavv currently sees your brand and what it thinks you should focus on.
      </p>

      <div className="mt-4 rounded-2xl bg-zinc-900/80 p-4 text-sm leading-relaxed text-zinc-100">
        {narrativeSummary}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        <span className="rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em]">
          Primary channel: {platformLabel(primaryPlatform)}
        </span>
      </div>
    </section>
  );
}
