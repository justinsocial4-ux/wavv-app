"use client";

import type { HashtagStat } from "@/app/dashboard/metrics";

type Props = {
  hashtagStats: HashtagStat[];
  baselineAvgPlays: number;
};

export function HashtagInsightsCard({
  hashtagStats,
  baselineAvgPlays,
}: Props) {
  if (hashtagStats.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-4">
        <h2 className="mb-1 text-lg font-medium">Hashtag insights</h2>
        <p className="text-xs text-gray-500">
          No hashtag data in this time range yet. Once you post more videos
          with hashtags, we’ll surface which tags are consistently driving
          above-baseline performance.
        </p>
      </div>
    );
  }

  const topMomentum = hashtagStats[0];

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-4">
      <h2 className="mb-2 text-lg font-medium">Hashtag insights</h2>
      <p className="mb-3 text-xs text-gray-500">
        Which tags actually move the needle for you in this time range.
      </p>

      {/* Highlight pill */}
      <div className="mb-4 rounded-xl border border-amber-500/60 bg-amber-500/10 px-4 py-3 text-xs">
        <p className="text-[11px] uppercase tracking-wide text-amber-300">
          Top momentum tag
        </p>
        <p className="mt-1 text-sm text-amber-100">
          <span className="font-semibold">#{topMomentum.tag}</span>{" "}
          is performing{" "}
          <span className="font-semibold">
            {topMomentum.liftVsBaseline >= 0 ? "+" : ""}
            {topMomentum.liftVsBaseline.toFixed(0)}%
          </span>{" "}
          vs your typical video.
        </p>
        <p className="mt-1 text-[11px] text-amber-200/80">
          Avg plays with this tag:{" "}
          {Math.round(topMomentum.avgPlays).toLocaleString()} · Baseline:{" "}
          {Math.round(baselineAvgPlays || 0).toLocaleString()}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-800/80 bg-black/40">
        <div className="grid grid-cols-[1.5fr,0.7fr,1fr,1fr] border-b border-gray-800 bg-gray-900/80 px-3 py-2 text-[11px] font-medium text-gray-300">
          <div>Hashtag</div>
          <div className="text-right">Videos</div>
          <div className="text-right">Avg plays</div>
          <div className="text-right">Lift vs baseline</div>
        </div>
        <div className="max-h-56 overflow-y-auto">
          {hashtagStats.map((h) => (
            <div
              key={h.tag}
              className="grid grid-cols-[1.5fr,0.7fr,1fr,1fr] border-b border-gray-900/60 px-3 py-2 text-[11px] text-gray-300 last:border-b-0"
            >
              <div className="truncate">
                <span className="text-gray-400">#</span>
                <span>{h.tag}</span>
              </div>
              <div className="text-right text-gray-400">
                {h.videos}
              </div>
              <div className="text-right">
                {Math.round(h.avgPlays).toLocaleString()}
              </div>
              <div
                className={`text-right ${
                  h.liftVsBaseline > 5
                    ? "text-emerald-400"
                    : h.liftVsBaseline < -5
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {h.liftVsBaseline >= 0 ? "+" : ""}
                {h.liftVsBaseline.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
