// src/app/dashboard/components/EngagementMetricCard.tsx
"use client";

import { useState } from "react";

type EngagementMode = "plays" | "reach" | "followers" | "viral";

type EngagementMetricCardProps = {
  loading: boolean;
  totalPlays: number;
  totalEngagements: number;
  followerCount: number;
  totalShares: number;
  totalVideos: number;
};

export function EngagementMetricCard({
  loading,
  totalPlays,
  totalEngagements,
  followerCount,
  totalShares,
  totalVideos,
}: EngagementMetricCardProps) {
  const [engagementMode, setEngagementMode] =
    useState<EngagementMode>("plays");

  const engagementRatePlays =
    totalPlays > 0 ? (totalEngagements / totalPlays) * 100 : 0;

  const engagementRateFollowers =
    followerCount > 0 ? (totalEngagements / followerCount) * 100 : 0;

  const reachEstimate = totalPlays; // placeholder for future reach logic
  const engagementRateReach =
    reachEstimate > 0 ? (totalEngagements / reachEstimate) * 100 : 0;

  const viralScore =
    totalVideos > 0 ? (totalShares / totalVideos) * 100 : 0;

  let engagementValue = 0;
  let engagementLabel = "";
  let engagementSubcopy = "";

  switch (engagementMode) {
    case "plays":
      engagementValue = engagementRatePlays;
      engagementLabel = "Engagement / plays";
      engagementSubcopy = "(Likes + comments + shares) / plays";
      break;
    case "reach":
      engagementValue = engagementRateReach;
      engagementLabel = "Engagement / reach";
      engagementSubcopy =
        "Approx. reach based on views (placeholder – upgrade later)";
      break;
    case "followers":
      engagementValue = engagementRateFollowers;
      engagementLabel = "Engagement / followers";
      engagementSubcopy =
        "How much your follower base is engaging with this range";
      break;
    case "viral":
      engagementValue = viralScore;
      engagementLabel = "Viral signal";
      engagementSubcopy = "Shares per video (rough virality proxy)";
      break;
  }

  return (
    <div className="mb-10">
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          Engagement metric
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["plays", "reach", "followers", "viral"] as EngagementMode[]).map(
            (mode) => (
              <button
                key={mode}
                onClick={() => setEngagementMode(mode)}
                className={`rounded-full border px-2 py-1 text-[11px] transition ${
                  engagementMode === mode
                    ? "border-white bg-white/10 text-white"
                    : "border-gray-700 text-gray-300 hover:border-gray-400"
                }`}
              >
                {mode === "plays" && "Plays"}
                {mode === "reach" && "Reach"}
                {mode === "followers" && "Followers"}
                {mode === "viral" && "Viral"}
              </button>
            )
          )}
        </div>
        <p className="mt-2 text-3xl font-semibold">
          {loading ? "…" : `${engagementValue.toFixed(2)}%`}
        </p>
        <p className="mt-1 text-[11px] text-gray-500">
          {engagementLabel}
          <br />
          {engagementSubcopy}
        </p>
      </div>
    </div>
  );
}
