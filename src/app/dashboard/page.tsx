// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import TimezoneInitializer from "@/components/TimezoneInitializer";

import { PerformanceTrendChart } from "./components/PerformanceTrendChart";
import { PostingCadenceCard } from "./components/PostingCadenceCard";
import { HashtagInsightsCard } from "./components/HashtagInsightsCard";

import { StrategySummaryCard } from "@/components/StrategySummaryCard";
import { WeeklyPlanCard } from "@/components/WeeklyPlanCard";
import { NextPostCard } from "@/components/NextPostCard";

import { jayCreatorProfile, jayCreatorGoals } from "@/lib/creator/jayProfile";
import { computeStrategy } from "@/lib/strategy/computeStrategy";
import type { PlatformMetricsSummary } from "@/lib/creator/types";

import {
  TimeRangeKey,
  DailyPoint,
  WeeklyCadencePoint,
  HashtagStat,
  getDaysForRange,
  filterPostsByTimeRange,
  buildDailyPoints,
  buildWeeklyCadencePoints,
  buildHashtagStats,
} from "./metrics";

import { useTikTokData } from "./useTikTokData";
import { TimeRangeSelector } from "./components/TimeRangeSelector";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabaseClient";

type EngagementMode = "plays" | "reach" | "followers" | "viral";

type MinimalConnectedAccount = {
  id: string;
  platform: string;
  username: string | null;
  is_primary: boolean | null;
};

type CreatorProfileForDashboard = {
  id: string;
  display_name: string;
  connected_accounts: MinimalConnectedAccount[] | null;
};

function formatShortDate(dateStr: string | Date): string {
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (isNaN(d.getTime())) return typeof dateStr === "string" ? dateStr : "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  // ---------- Which account powers this dashboard? ----------
  const [profiles, setProfiles] = useState<CreatorProfileForDashboard[]>([]);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [activeAccount, setActiveAccount] =
    useState<MinimalConnectedAccount | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAccountsForUser() {
      setAccountLoading(true);
      setAccountError(null);

      const { data, error } = await supabase
        .from("creator_profiles")
        .select(
          `
          id,
          display_name,
          connected_accounts (
            id,
            platform,
            username,
            is_primary
          )
        `
        )
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Error loading profiles for dashboard:", error);
        setAccountError("Could not load your connected accounts.");
        setAccountLoading(false);
        return;
      }

      const typedProfiles = (data ?? []) as CreatorProfileForDashboard[];
      setProfiles(typedProfiles);

      // Flatten all accounts across profiles
      const allAccounts: MinimalConnectedAccount[] = typedProfiles.flatMap(
        (p) => p.connected_accounts ?? []
      );

      // Filter to TikTok
      const tiktokAccounts = allAccounts.filter(
        (a) => a.platform.toLowerCase() === "tiktok"
      );

      // Choose primary TikTok if available, else first TikTok
      let chosen: MinimalConnectedAccount | null = null;
      if (tiktokAccounts.length > 0) {
        const primary = tiktokAccounts.find((a) => a.is_primary);
        chosen = primary ?? tiktokAccounts[0];
      }

      setActiveAccount(chosen);
      setAccountLoading(false);
    }

    loadAccountsForUser();

    return () => {
      cancelled = true;
    };
  }, []);

  function activeUsernameSafe(u: string) {
    // Strip leading @ if we ever store it that way
    return u.startsWith("@") ? u.slice(1) : u;
  }

  const effectiveUsername =
    activeAccount?.username && activeAccount.username.trim().length > 0
      ? activeUsernameSafe(activeAccount.username)
      : null;

  // We still call the hook with *something* so hooks stay unconditional.
  // If there's no username yet, this just becomes a no-op / empty dataset.
  const usernameForHooks = effectiveUsername ?? "";

  // ---------- TikTok data for the active account (if any) ----------
  const {
    posts,
    profile,
    loading,
    refreshing,
    error,
    handleRefresh,
  } = useTikTokData(usernameForHooks);

  // ---------- Early render states: loading / no TikTok connected ----------
  if (accountLoading) {
    return (
      <AuthGate>
        <main className="min-h-screen bg-black text-white">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <h1 className="text-3xl font-semibold tracking-tight">
              Wavv Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Loading your connected accounts…
            </p>
          </div>
        </main>
      </AuthGate>
    );
  }

  if (!activeAccount || !effectiveUsername) {
    return (
      <AuthGate>
        <main className="min-h-screen bg-black text-white">
          <div className="mx-auto max-w-6xl px-6 py-10 space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight">
              Wavv Dashboard
            </h1>

            {accountError && (
              <p className="text-sm text-red-400">{accountError}</p>
            )}

            <p className="text-sm text-gray-400">
              You don’t have a TikTok account connected yet.
            </p>
            <p className="text-xs text-gray-500">
              Go to the <span className="font-semibold">Accounts</span> page to
              create a creator profile and connect your TikTok channel. Once
              that’s done, Wavv will pull your posts, compute performance
              metrics, and light up this dashboard.
            </p>

            <a
              href="/accounts"
              className="inline-flex items-center rounded-full border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-100 hover:border-gray-400 hover:bg-gray-800"
            >
              Go to Accounts
            </a>
          </div>
        </main>
      </AuthGate>
    );
  }

  // ---------- From here down: we KNOW we have an active TikTok account ----------
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("all");
  const [customDays, setCustomDays] = useState<number | null>(null);
  const [engagementMode, setEngagementMode] =
    useState<EngagementMode>("plays");

  // ----- filtered posts for chosen range -----
  const filteredPosts = filterPostsByTimeRange(
    posts,
    timeRange,
    customDays
  );

  const latestPost = filteredPosts[0] ?? null;

  // Core aggregates
  const totalVideos = filteredPosts.length;
  const totalPlays = filteredPosts.reduce(
    (sum, row) => sum + (row.play_count ?? 0),
    0
  );
  const totalLikes = filteredPosts.reduce(
    (sum, row) => sum + (row.like_count ?? 0),
    0
  );
  const totalComments = filteredPosts.reduce(
    (sum, row) => sum + (row.comment_count ?? 0),
    0
  );
  const totalShares = filteredPosts.reduce(
    (sum, row) => sum + (row.share_count ?? 0),
    0
  );
  const totalEngagements = totalLikes + totalComments + totalShares;

  const totalCollects = filteredPosts.reduce(
    (sum, row) => sum + (row.collect_count ?? 0),
    0
  );
  const totalDownloads = filteredPosts.reduce(
    (sum, row) => sum + (row.download_count ?? 0),
    0
  );
  const totalForwardShares = filteredPosts.reduce(
    (sum, row) =>
      sum +
      (row.forward_count ?? 0) +
      (row.repost_count ?? 0) +
      (row.whatsapp_share_count ?? 0),
    0
  );
  const totalAllShares = totalShares + totalForwardShares;

  const avgEngagementRatePct =
    totalPlays > 0 ? (totalEngagements / totalPlays) * 100 : 0;

  const avgPlaysPerVideo =
    totalVideos > 0 ? totalPlays / totalVideos : 0;

  const followerCount = profile?.follower_count ?? 0;

  // ----- daily / weekly / hashtag metrics -----
  const dailyPoints: DailyPoint[] = buildDailyPoints(filteredPosts);
  const weeklyCadence: WeeklyCadencePoint[] =
    buildWeeklyCadencePoints(filteredPosts);
  const baselineAvgPlays =
    totalVideos > 0 ? totalPlays / totalVideos : 0;
  const hashtagStats: HashtagStat[] = buildHashtagStats(
    filteredPosts,
    baselineAvgPlays
  );

  // ----- effective active days for cadence -----
  const rangeDays = getDaysForRange(timeRange, customDays);
  let effectiveActiveDays = 0;

  if (rangeDays && rangeDays > 0) {
    effectiveActiveDays = rangeDays;
  } else if (dailyPoints.length > 1) {
    const first = new Date(dailyPoints[0].date);
    const last = new Date(dailyPoints[dailyPoints.length - 1].date);
    const diffMs = last.getTime() - first.getTime();
    const diffDays = Math.round(
      diffMs / (1000 * 60 * 60 * 24)
    );
    effectiveActiveDays = Math.max(diffDays + 1, 1);
  } else if (dailyPoints.length === 1) {
    effectiveActiveDays = 7;
  } else {
    effectiveActiveDays = 0;
  }

  const videosPerWeek =
    effectiveActiveDays > 0
      ? (totalVideos / effectiveActiveDays) * 7
      : 0;

  // ----- engagement metric variants -----
  const engagementRatePlays =
    totalPlays > 0 ? (totalEngagements / totalPlays) * 100 : 0;

  const engagementRateFollowers =
    followerCount > 0
      ? (totalEngagements / followerCount) * 100
      : 0;

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

  // Best-performing video in range
  const bestPost =
    filteredPosts.length > 0
      ? filteredPosts.reduce((best, current) => {
          const bestPlays = best.play_count ?? 0;
          const currPlays = current.play_count ?? 0;
          return currPlays > bestPlays ? current : best;
        }, filteredPosts[0])
      : null;

  const bestPostEngagementRate =
    bestPost && (bestPost.play_count ?? 0) > 0
      ? (((bestPost.like_count ?? 0) +
          (bestPost.comment_count ?? 0) +
          (bestPost.share_count ?? 0)) /
          (bestPost.play_count ?? 1)) *
        100
      : 0;

  // Historical baseline cadence (all-time)
  let baselineVideosPerWeek = 0;
  if (posts.length > 1) {
    const dateStrings = posts
      .map((p) => p.created_at ?? p.p_created_at)
      .filter((d): d is string => !!d);

    if (dateStrings.length > 1) {
      const dates = dateStrings
        .map((d) => new Date(d))
        .filter((d) => !isNaN(d.getTime()));
      if (dates.length > 1) {
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
        const msDiff = maxDate.getTime() - minDate.getTime();
        const daysSpan = msDiff / (1000 * 60 * 60 * 24) + 1;
        const weeksSpan = daysSpan / 7;
        baselineVideosPerWeek =
          weeksSpan > 0 ? posts.length / weeksSpan : 0;
      }
    }
  }

  // Cadence narrative
  let cadenceSentence = "";
  if (!posts.length) {
    cadenceSentence =
      "You haven’t posted on this account yet. Once you start posting, I’ll benchmark your cadence.";
  } else if (videosPerWeek === 0) {
    cadenceSentence =
      "This range doesn’t include any posts. Try expanding the window or posting again.";
  } else if (baselineVideosPerWeek === 0) {
    cadenceSentence =
      "This range is the start of your posting history, so I’m treating this cadence as your baseline.";
  } else {
    const delta = videosPerWeek - baselineVideosPerWeek;
    const relDelta =
      baselineVideosPerWeek > 0 ? delta / baselineVideosPerWeek : 0;

    if (relDelta >= 0.15) {
      cadenceSentence = `You’re posting above your typical pace (~${baselineVideosPerWeek.toFixed(
        2
      )} videos/week historically).`;
    } else if (relDelta <= -0.15) {
      cadenceSentence = `You’re posting below your usual cadence (baseline ~${baselineVideosPerWeek.toFixed(
        2
      )} videos/week).`;
    } else {
      cadenceSentence = `You’re roughly on pace with your normal cadence (~${baselineVideosPerWeek.toFixed(
        2
      )} videos/week).`;
    }
  }

  const aiSummaryMain = `This range: ${totalVideos} ${
    totalVideos === 1 ? "post" : "posts"
  } • ${totalPlays.toLocaleString()} plays${
    followerCount ? ` • ${followerCount.toLocaleString()} followers` : ""
  }.`;

  const topHashtags = hashtagStats.slice(0, 3).map((h) =>
    h.tag.startsWith("#") ? h.tag : `#${h.tag}`
  );

  let hashtagSentence = "";
  if (topHashtags.length === 0) {
    hashtagSentence =
      "Use a few consistent hashtags across multiple posts so I can spot which tags actually move the needle.";
  } else if (topHashtags.length === 1) {
    hashtagSentence = `Re-use ${topHashtags[0]} in this next wave of posts to keep testing momentum.`;
  } else {
    hashtagSentence = `Lean on ${topHashtags
      .slice(0, 2)
      .join(", ")}${
      topHashtags[2] ? `, ${topHashtags[2]}` : ""
    } in this range.`;
  }

  // Range labels for charts
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;

  if (rangeDays && rangeDays > 0) {
    rangeEnd = new Date();
    rangeStart = new Date();
    rangeStart.setDate(rangeEnd.getDate() - rangeDays + 1);
  } else if (dailyPoints.length > 0) {
    rangeStart = new Date(dailyPoints[0].date);
    rangeEnd = new Date(dailyPoints[dailyPoints.length - 1].date);
  }

  const leftLabel =
    rangeStart != null
      ? formatShortDate(rangeStart)
      : dailyPoints.length > 0
      ? formatShortDate(dailyPoints[0].date)
      : "";

  const rightLabel =
    rangeEnd != null
      ? formatShortDate(rangeEnd)
      : dailyPoints.length > 0
      ? formatShortDate(
          dailyPoints[dailyPoints.length - 1].date
        )
      : "";

  // ---------- Strategy engine wiring (still using jayProfile for now) ----------
  const platformMetricsSummary: PlatformMetricsSummary[] = [
    {
      platform: "tiktok",
      postsInRange: totalVideos,
      playsInRange: totalPlays,
      engagementsInRange: totalEngagements,
      videosPerWeek,

      sharesInRange: totalAllShares,
      savesInRange: totalCollects,
      downloadsInRange: totalDownloads,
      avgEngagementRatePct,
    },
  ];

  const strategy = computeStrategy({
    profile: jayCreatorProfile,
    goals: jayCreatorGoals,
    platformMetrics: platformMetricsSummary,
  });

  const accountLabel = activeAccount.username ?? "TikTok";

  // ---------- RENDER ----------
  return (
    <AuthGate>
      <main className="min-h-screen bg-black text-white">
        <TimezoneInitializer username={effectiveUsername!} />

        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Wavv Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                TikTok performance for{" "}
                <span className="font-medium">@{accountLabel}</span>
              </p>
              {accountError && (
                <p className="mt-1 text-xs text-red-400">
                  {accountError}
                </p>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-2 text-sm font-medium shadow-sm transition hover:border-gray-400 hover:from-gray-800 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing…" : "Refresh TikTok data"}
            </button>
          </div>

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
          <section className="mb-6">
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Wavv read on this range
              </p>
              <p className="mt-2 text-sm text-gray-100">
                {aiSummaryMain}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                <span className="font-semibold">Cadence: </span>
                {cadenceSentence}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                <span className="font-semibold">Hashtags: </span>
                {hashtagSentence}
              </p>
            </div>
          </section>

          {/* Top summary tiles */}
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Videos in range
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {loading ? "…" : totalVideos}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Total plays
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {loading ? "…" : totalPlays.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Total likes
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {loading ? "…" : totalLikes.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Account + insight row */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            {/* Account stats */}
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4 md:col-span-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Account stats
              </p>
              {profile ? (
                <div className="mt-3 flex flex-wrap gap-8 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">
                      Followers
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {profile.follower_count != null
                        ? profile.follower_count.toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">
                      Total likes
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {profile.heart_count != null
                        ? profile.heart_count.toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">
                      Videos posted
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {profile.video_count != null
                        ? profile.video_count.toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-gray-500">
                  No profile snapshot yet. Refresh TikTok data to pull in the
                  latest stats.
                </p>
              )}
            </div>

            {/* Avg plays */}
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Avg plays per video
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {loading
                  ? "…"
                  : Math.round(avgPlaysPerVideo).toLocaleString()}
              </p>
            </div>

            {/* Engagement metric */}
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

          {/* Pace + best video */}
          <div className="mb-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Posting pace
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {loading ? "…" : videosPerWeek.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                videos per week in this range
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4 md:col-span-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Best-performing video
              </p>
              {bestPost ? (
                <>
                  <p className="mt-2 line-clamp-2 text-sm font-medium">
                    {bestPost.caption || "(No caption)"}
                  </p>
                  <p className="mt-2 text-[11px] text-gray-500">
                    Plays: {bestPost.play_count ?? 0} · Engagement:{" "}
                    {bestPostEngagementRate.toFixed(2)}%
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  No videos in this time range.
                </p>
              )}
            </div>
          </div>

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
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-medium">Latest TikTok posts</h2>

            {loading && !latestPost && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-6 text-sm text-gray-400">
                Loading posts…
              </div>
            )}

            {!loading && !latestPost && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-6 text-sm text-gray-400">
                No posts found in this time range. Try expanding the range or hit
                “Refresh TikTok data”.
              </div>
            )}

            {latestPost && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 px-5 py-4">
                <p className="text-sm font-medium">
                  {latestPost.caption || "(No caption)"}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  Plays: {latestPost.play_count ?? 0} · Likes:{" "}
                  {latestPost.like_count ?? 0} · Comments:{" "}
                  {latestPost.comment_count ?? 0} · Shares:{" "}
                  {latestPost.share_count ?? 0}
                </p>
              </div>
            )}
          </section>

          {/* Strategy engine preview */}
          <section className="mb-12 space-y-8">
            <StrategySummaryCard strategy={strategy} />
            <WeeklyPlanCard plans={strategy.weeklyPlans} />
            <NextPostCard nextPost={strategy.nextPost} />
          </section>
        </div>
      </main>
    </AuthGate>
  );
}
