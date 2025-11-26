"use client";

import { NextPostRecommendation } from "@/lib/creator/types";
import { platformLabel } from "@/lib/strategy/uiHelpers";

type Props = {
  nextPost: NextPostRecommendation;
};

export function NextPostCard({ nextPost }: Props) {
  const {
    headline,
    platform,
    pillar,
    reasoning,
    suggestedTags,
    suggestedCTA,
    confidence,
    dataRequirementsMet,
  } = nextPost;

  const confidenceLabel =
    confidence === "high"
      ? "High confidence"
      : confidence === "medium"
      ? "Medium confidence"
      : "Learning mode";

  return (
    <section className="mt-6 rounded-3xl border border-amber-500/30 bg-amber-950/10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">
            What to post next
          </h2>
          <p className="mt-1 text-xs text-amber-200/80">
            A concrete next step based on your goals and recent performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full bg-amber-500/10 px-3 py-1 font-medium uppercase tracking-[0.16em] text-amber-300">
            {platformLabel(platform)}
          </span>
          {pillar && (
            <span className="rounded-full bg-amber-500/5 px-3 py-1 font-medium uppercase tracking-[0.16em] text-amber-200/80">
              Pillar: {pillar.replace("_", " ")}
            </span>
          )}
          <span className="rounded-full bg-zinc-900/80 px-3 py-1 font-medium uppercase tracking-[0.16em] text-zinc-300">
            {confidenceLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-amber-500/10 p-4">
        <p className="text-sm font-medium text-amber-50">{headline}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
            Why this
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-amber-100/90">
            {reasoning.map((r, idx) => (
              <li key={idx}>• {r}</li>
            ))}
            {!dataRequirementsMet && (
              <li className="mt-1 text-[11px] text-amber-300/90">
                • As you post more, Wavv will upgrade this from learning mode into
                higher-confidence guidance.
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-3 rounded-2xl bg-zinc-950/80 p-3 text-[11px] text-zinc-200">
          {suggestedTags && suggestedTags.length > 0 && (
            <div>
              <p className="font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Suggested tags
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {suggestedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-900 px-2 py-1 text-[10px] text-zinc-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {suggestedCTA && (
            <div>
              <p className="font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Suggested CTA
              </p>
              <p className="mt-1 text-[11px] text-zinc-200">{suggestedCTA}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
