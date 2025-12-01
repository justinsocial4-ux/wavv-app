// src/app/dashboard/DashboardShell.tsx
"use client";

import { useState } from "react";
import TimezoneInitializer from "@/components/TimezoneInitializer";

import { PerformanceTrendChart } from "./components/PerformanceTrendChart";
import { PostingCadenceCard } from "./components/PostingCadenceCard";
import { HashtagInsightsCard } from "./components/HashtagInsightsCard";
import { DashboardHeader } from "./components/DashboardHeader";
import { RangeSummaryCard } from "./components/RangeSummaryCard";
import { TopSummaryTiles } from "./components/TopSummaryTiles";
import { AccountAndAvgRow } from "./components/AccountAndAvgRow";
import { EngagementMetricCard } from "./components/EngagementMetricCard";
import { LatestPostsSection } from "./components/LatestPostsSection";
import { StrategyPreviewSection } from "./components/StrategyPreviewSection";

import { jayCreatorProfile, jayCreatorGoals } from "@/lib/creator/jayProfile";
import { computeStrategy } from "@/lib/strategy/computeStrategy";

import {
  TimeRangeKey,
  TikTokPostRow,
  ProfileRow,
  filterPostsByTimeRange,
  computeDashboardMetrics,
  buildPlatformMetricsSummaryFromDashboard,
} from "./metrics";

import { useTikTokData } from "./useTikTokData";
import { TimeRangeSelector } from "./components/TimeRangeSelector";

const DEFAULT_DASHBOARD_USERNAME = "bigdealjfk";

type DashboardShellProps = {
  /**
   * The creator_profile this dashboard is scoped to.
   * Not used yet — we’ll wire this when we add multi-profile routing.
   */
  profileId?: string;

  /**
   * Primary username for this dashboard (e.g. TikTok handle).
   * For now defaults to your handle; later this will come from connected_accounts.
   */
  username?: string;
};

export default function DashboardShell({
  profileId: _profileId, // reserved for future use
  username,
}: DashboardShellProps) {
  const effectiveUsername = username ?? DEFAULT_DASHBOARD_USERNAME;

  const {
    posts,
    profile,
    loading,
    refreshing,
    error,
    handleRefresh,
  } = useTikTokData(effectiveUsername);

  const [timeRange, setTimeRange] = useState<TimeRangeKey>("all");
  const [customDays, setCustomDays] = useState<number | null>(null);

  // ----- Filter posts for chosen range -----
  const filteredPosts = filterPostsByTimeRange(
    posts as TikTokPostRow[],
    timeRange,
    customDays
  );

  const latestPost = filteredPosts[0] ?? null;

  // ----- Compute all dashboard metrics in one place -----
  const metrics = computeDashboardMetrics(
    posts as TikTokPostRow[],
    filteredPosts,
    (profile as ProfileRow | null) ?? null,
    timeRange,
    customDays
  );

  const {
    totalVideos,
    totalPlays,
    totalLikes,
    totalComments,
    totalShares,
    totalEngagements,
    totalCollects,
    totalDownloads,
    totalForwardShares,
    totalAllShares,
    avgEngagementRatePct,

    baselineAvgPlays,
    videosPerWeek,
    baselineVideosPerWeek,
    effectiveActiveDays,

    dailyPoints,
    weeklyCadence,
    hashtagStats,

    cadenceSentence,
    aiSummaryMain,
    hashtagSentence,

    leftLabel,
    rightLabel,
  } = metrics;

  const followerCount = profile?.follower_count ?? 0;
  const avgPlaysPerVideo =
    totalVideos > 0 ? totalPlays / totalVideos : 0;

  // ---------- Strategy engine wiring ----------
  const platformMetricsSummary =
    buildPlatformMetricsSummaryFromDashboard(metrics);

  const strategy = computeStrategy({
    profile: jayCreatorProfile,
    goals: jayCreatorGoals,
    platformMetrics: platformMetricsSummary,
  });

  // ---------- RENDER ----------
  return (
    <main className="min-h-screen bg-black text-white">
      <TimezoneInitializer username={effectiveUsername} />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <DashboardHeader
          username={effectiveUsername}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />

        {/* Time range selector */}
        <TimeRangeSelector
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          customDays={customDays}
          setCustomDays={setCustomDays}
        />

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/70 bg-red-900/30 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {/* Wavv read on this range */}
        <RangeSummaryCard
          aiSummaryMain={aiSummaryMain}
          cadenceSentence={cadenceSentence}
          hashtagSentence={hashtagSentence}
        />

        {/* Top summary tiles */}
        <TopSummaryTiles
          loading={loading}
          totalVideos={totalVideos}
          totalPlays={totalPlays}
          totalLikes={totalLikes}
        />

        {/* Account stats + avg plays */}
        <AccountAndAvgRow
          profile={profile as any}
          loading={loading}
          avgPlaysPerVideo={avgPlaysPerVideo}
        />

        {/* Engagement metric */}
        <EngagementMetricCard
          loading={loading}
          totalPlays={totalPlays}
          totalEngagements={totalEngagements}
          followerCount={followerCount}
          totalShares={totalShares}
          totalVideos={totalVideos}
        />

        {/* Performance trend + posting cadence */}
        <section className="mb-10 grid gap-6 lg:grid-cols-[3fr,2fr]">
          <PerformanceTrendChart
            dailyPoints={dailyPoints}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          />
          <PostingCadenceCard
            weeklyCadence={weeklyCadence}
            overallPostsInRange={totalVideos}
            activeDays={effectiveActiveDays}
          />
        </section>

        {/* Hashtag insights */}
        <section className="mb-10">
          <HashtagInsightsCard
            hashtagStats={hashtagStats}
            baselineAvgPlays={baselineAvgPlays}
          />
        </section>

        {/* Latest posts */}
        <LatestPostsSection loading={loading} latestPost={latestPost} />

        {/* Strategy engine preview */}
        <StrategyPreviewSection strategy={strategy} />
      </div>
    </main>
  );
}
  