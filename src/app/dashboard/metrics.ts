// src/app/dashboard/metrics.ts

import type { PlatformMetricsSummary } from "@/lib/creator/types";

// ---- Shared types for dashboard data ----

export type TimeRangeKey =
  | "7d"
  | "14d"
  | "30d"
  | "90d"
  | "180d"
  | "365d"
  | "all"
  | "custom";

export const FIXED_TIME_RANGES: {
  key: TimeRangeKey;
  label: string;
  days: number | null;
}[] = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "14d", label: "Last 14 days", days: 14 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "180d", label: "Last 6 months", days: 180 },
  { key: "365d", label: "Last 12 months", days: 365 },
  { key: "all", label: "All time", days: null },
];

export type TikTokPostRow = {
  id: string;
  tiktok_id: string | null;
  username: string | null;
  caption: string | null;
  created_at: string | null;
  p_created_at: string | null;
  play_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  video_url: string | null;
  thumbnail_url: string | null;
  hashtags: string[] | null;
  collect_count?: number | null;
  download_count?: number | null;
  forward_count?: number | null;
  repost_count?: number | null;
  whatsapp_share_count?: number | null;
};

export type ProfileRow = {
  username: string;
  follower_count: number | null;
  heart_count: number | null;
  video_count: number | null;
  digg_count: number | null;
  following_count: number | null;
  avatar_url: string | null;
  bio: string | null;
};

export type DailyPoint = {
  date: string; // YYYY-MM-DD
  totalPlays: number;
  totalEngagements: number;
  videoCount: number;
};

export type WeeklyCadencePoint = {
  weekStart: string; // YYYY-MM-DD (Monday)
  postCount: number;
  totalPlays: number;
  avgPlaysPerPost: number;
};

export type HashtagStat = {
  tag: string;
  videos: number;
  totalPlays: number;
  totalEngagements: number;
  avgPlays: number;
  liftVsBaseline: number; // percentage
};

export interface DashboardMetrics {
  totalVideos: number;
  totalPlays: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalEngagements: number;
  totalCollects: number;
  totalDownloads: number;
  totalForwardShares: number;
  totalAllShares: number;
  avgEngagementRatePct: number;

  baselineAvgPlays: number;
  videosPerWeek: number;
  baselineVideosPerWeek: number;
  effectiveActiveDays: number;

  dailyPoints: DailyPoint[];
  weeklyCadence: WeeklyCadencePoint[];
  hashtagStats: HashtagStat[];

  cadenceSentence: string;
  aiSummaryMain: string;
  hashtagSentence: string;

  leftLabel: string;
  rightLabel: string;
}

// ---- Time-range helpers ----

export function getDaysForRange(
  timeRange: TimeRangeKey,
  customDays: number | null
): number | null {
  if (timeRange === "all") return null;
  if (timeRange === "custom") return customDays;

  const config = FIXED_TIME_RANGES.find((t) => t.key === timeRange);
  return config ? config.days : null;
}

/**
 * NOTE: Generic so we preserve ALL fields on the post rows.
 * T must at least have created_at / p_created_at.
 */
export function filterPostsByTimeRange<
  T extends { created_at: string | null; p_created_at: string | null }
>(
  posts: T[],
  timeRange: TimeRangeKey,
  customDays: number | null
): T[] {
  if (timeRange === "all") return posts;

  const days = getDaysForRange(timeRange, customDays);
  if (days == null) return posts;

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);

  return posts.filter((row) => {
    const dateStr = row.created_at ?? row.p_created_at;
    if (!dateStr) return false;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    return d >= cutoff;
  });
}

// ---- Aggregation helpers ----

export function buildDailyPoints(
  filteredPosts: TikTokPostRow[]
): DailyPoint[] {
  const byDate = new Map<
    string,
    { plays: number; engagements: number; videos: number }
  >();

  for (const row of filteredPosts) {
    const dateSrc = row.created_at ?? row.p_created_at;
    if (!dateSrc) continue;

    const d = new Date(dateSrc);
    if (isNaN(d.getTime())) continue;

    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD

    const plays = row.play_count ?? 0;
    const likes = row.like_count ?? 0;
    const comments = row.comment_count ?? 0;
    const shares = row.share_count ?? 0;
    const engagements = likes + comments + shares;

    const existing =
      byDate.get(key) ?? { plays: 0, engagements: 0, videos: 0 };

    existing.plays += plays;
    existing.engagements += engagements;
    existing.videos += 1;

    byDate.set(key, existing);
  }

  return Array.from(byDate.entries())
    .map(([date, vals]) => ({
      date,
      totalPlays: vals.plays,
      totalEngagements: vals.engagements,
      videoCount: vals.videos,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function getIsoWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0–6 (Sun–Sat)
  const diff = (day + 6) % 7; // days since Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

export function buildWeeklyCadencePoints(
  filteredPosts: TikTokPostRow[]
): WeeklyCadencePoint[] {
  const byWeek = new Map<string, { posts: number; plays: number }>();

  for (const row of filteredPosts) {
    const dateSrc = row.created_at ?? row.p_created_at;
    if (!dateSrc) continue;
    const d = new Date(dateSrc);
    if (isNaN(d.getTime())) continue;

    const weekStart = getIsoWeekStart(d);
    const key = weekStart.toISOString().slice(0, 10);

    const plays = row.play_count ?? 0;

    const existing = byWeek.get(key) ?? { posts: 0, plays: 0 };
    existing.posts += 1;
    existing.plays += plays;
    byWeek.set(key, existing);
  }

  return Array.from(byWeek.entries())
    .map(([weekStart, vals]) => ({
      weekStart,
      postCount: vals.posts,
      totalPlays: vals.plays,
      avgPlaysPerPost: vals.posts > 0 ? vals.plays / vals.posts : 0,
    }))
    .sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1));
}

export function buildHashtagStats(
  filteredPosts: TikTokPostRow[],
  baselineAvgPlays: number
): HashtagStat[] {
  const map = new Map<
    string,
    { videos: number; plays: number; engagements: number }
  >();

  for (const row of filteredPosts) {
    const tags = row.hashtags ?? [];
    if (!tags.length) continue;

    const plays = row.play_count ?? 0;
    const likes = row.like_count ?? 0;
    const comments = row.comment_count ?? 0;
    const shares = row.share_count ?? 0;
    const engagements = likes + comments + shares;

    for (const rawTag of tags) {
      const tag = rawTag.trim();
      if (!tag) continue;

      const existing =
        map.get(tag) ?? { videos: 0, plays: 0, engagements: 0 };

      existing.videos += 1;
      existing.plays += plays;
      existing.engagements += engagements;

      map.set(tag, existing);
    }
  }

  const stats: HashtagStat[] = Array.from(map.entries()).map(
    ([tag, vals]) => {
      const avgPlays =
        vals.videos > 0 ? vals.plays / vals.videos : 0;
      const liftVsBaseline =
        baselineAvgPlays > 0
          ? (avgPlays / baselineAvgPlays - 1) * 100
          : 0;

      return {
        tag,
        videos: vals.videos,
        totalPlays: vals.plays,
        totalEngagements: vals.engagements,
        avgPlays,
        liftVsBaseline,
      };
    }
  );

  return stats
    .filter((h) => h.videos >= 1)
    .sort((a, b) => b.avgPlays - a.avgPlays)
    .slice(0, 10);
}

function formatShortDate(dateStr: string | Date): string {
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (isNaN(d.getTime())) return typeof dateStr === "string" ? dateStr : "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ---- Main metrics computer ----

export function computeDashboardMetrics(
  allPosts: TikTokPostRow[],
  filteredPosts: TikTokPostRow[],
  profile: ProfileRow | null,
  timeRange: TimeRangeKey,
  customDays: number | null
): DashboardMetrics {
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

  const dailyPoints = buildDailyPoints(filteredPosts);
  const weeklyCadence = buildWeeklyCadencePoints(filteredPosts);
  const baselineAvgPlays =
    totalVideos > 0 ? totalPlays / totalVideos : 0;
  const hashtagStats = buildHashtagStats(filteredPosts, baselineAvgPlays);

  // ----- Effective active days for cadence -----
  const rangeDays = getDaysForRange(timeRange, customDays);
  let effectiveActiveDays = 0;

  if (rangeDays && rangeDays > 0) {
    effectiveActiveDays = rangeDays;
  } else if (dailyPoints.length > 1) {
    const first = new Date(dailyPoints[0].date);
    const last = new Date(dailyPoints[dailyPoints.length - 1].date);
    const diffMs = last.getTime() - first.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
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

  // ----- Historical baseline cadence -----
  let baselineVideosPerWeek = 0;
  if (allPosts.length > 1) {
    const dateStrings = allPosts
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
          weeksSpan > 0 ? allPosts.length / weeksSpan : 0;
      }
    }
  }

  // ----- Cadence narrative -----
  let cadenceSentence = "";
  if (!allPosts.length) {
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

  const followerCount = profile?.follower_count ?? null;
  const aiSummaryMain = `This range: ${totalVideos} ${
    totalVideos === 1 ? "post" : "posts"
  } • ${totalPlays.toLocaleString()} plays${
    followerCount ? ` • ${followerCount.toLocaleString()} followers` : ""
  }.`;

  // Simple hashtag suggestion sentence
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

  // Range labels (for charts)
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
      ? formatShortDate(dailyPoints[dailyPoints.length - 1].date)
      : "";

  return {
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
  };
}

// Optional helper to feed the strategy engine
export function buildPlatformMetricsSummaryFromDashboard(
  metrics: DashboardMetrics
): PlatformMetricsSummary[] {
  return [
    {
      platform: "tiktok",
      postsInRange: metrics.totalVideos,
      playsInRange: metrics.totalPlays,
      engagementsInRange: metrics.totalEngagements,
      videosPerWeek: metrics.videosPerWeek,
      sharesInRange: metrics.totalAllShares,
      savesInRange: metrics.totalCollects,
      downloadsInRange: metrics.totalDownloads,
      avgEngagementRatePct: metrics.avgEngagementRatePct,
    },
  ];
}
