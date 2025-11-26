// src/lib/strategy/computeStrategy.ts

import {
  ContentPillar,
  CreatorGoals,
  CreatorProfile,
  NextPostRecommendation,
  Platform,
  PlatformMetricsSummary,
  StrategyContext,
  WeeklyContentPlan,
} from "@/lib/creator/types";
import { humanizePillar, platformLabel } from "./uiHelpers";

export interface ComputedStrategy {
  context: StrategyContext;
  primaryPlatform: Platform;
  narrativeSummary: string;
  weeklyPlans: WeeklyContentPlan[];
  nextPost: NextPostRecommendation;
}

type ComputeArgs = {
  profile: CreatorProfile;
  goals: CreatorGoals;
  platformMetrics: PlatformMetricsSummary[];
};

export function computeStrategy({
  profile,
  goals,
  platformMetrics,
}: ComputeArgs): ComputedStrategy {
  const metricsMap: StrategyContext["platformMetrics"] = {
    tiktok: undefined,
    instagram: undefined,
    youtube: undefined,
    twitter: undefined,
    newsletter: undefined,
  };

  for (const m of platformMetrics) {
    metricsMap[m.platform] = m;
  }

  const context: StrategyContext = {
    creatorProfile: profile,
    goals,
    platformMetrics: metricsMap,
  };

  const primaryPlatform = choosePrimaryPlatform(profile, platformMetrics);
  const narrativeSummary = buildNarrative(context, primaryPlatform);
  const weeklyPlans = buildWeeklyPlans(context, primaryPlatform);
  const nextPost = buildNextPostRecommendation(context, primaryPlatform);

  return {
    context,
    primaryPlatform,
    narrativeSummary,
    weeklyPlans,
    nextPost,
  };
}

// -------- helpers --------

function choosePrimaryPlatform(
  profile: CreatorProfile,
  metrics: PlatformMetricsSummary[]
): Platform {
  // 1) Use preferredPlatforms if present
  if (profile.preferredPlatforms && profile.preferredPlatforms.length > 0) {
    const rank = { high: 3, medium: 2, low: 1 } as const;
    const sorted = [...profile.preferredPlatforms].sort(
      (a, b) => rank[b.priority] - rank[a.priority]
    );
    return sorted[0].platform;
  }

  // 2) Otherwise pick the platform with the most plays
  if (metrics.length > 0) {
    const sorted = [...metrics].sort(
      (a, b) => (b.playsInRange || 0) - (a.playsInRange || 0)
    );
    return sorted[0].platform;
  }

  // 3) Fallback
  return "tiktok";
}

function buildNarrative(
  context: StrategyContext,
  primary: Platform
): string {
  const m = context.platformMetrics[primary];
  const goals = context.goals;

  const primaryLabel = platformLabel(primary);
  const topGoal =
    goals.find((g) => g.priority === "high") ?? goals[0];

  if (!m) {
    return `Right now I’m treating ${primaryLabel} as your main channel, but I don’t have enough data in this range to say much yet. As you post more, I’ll shape a clearer strategy around your goals.`;
  }

  const cadence = m.videosPerWeek.toFixed(1);
  const plays = m.playsInRange.toLocaleString();
  const posts = m.postsInRange;

  const pillarText =
    context.creatorProfile.brandPillars.length > 0
      ? context.creatorProfile.brandPillars
          .slice(0, 3)
          .map((p) => humanizePillar(p as ContentPillar))
          .join(", ")
      : "your core story";

  const goalText = topGoal
    ? topGoal.label.toLowerCase()
    : "growing a consistent audience";

  return [
    `For this time range, I’m treating ${primaryLabel} as your primary channel.`,
    `You’ve posted ${posts} ${
      posts === 1 ? "video" : "videos"
    } here, generating about ${plays} plays at a cadence of ~${cadence} videos per week.`,
    `Given your focus on ${goalText}, I want you doubling down on ${pillarText} while we steadily increase volume and tighten the feedback loop on what works.`,
  ].join(" ");
}

function buildWeeklyPlans(
  context: StrategyContext,
  primary: Platform
): WeeklyContentPlan[] {
  const result: WeeklyContentPlan[] = [];
  const primaryMetrics = context.platformMetrics[primary];

  let baseCadence = 3;
  let primaryNotes =
    "Treat this as your baseline. If a format takes off, we’ll bias more of the week toward that pattern.";

  if (primaryMetrics) {
    const postsInRange = primaryMetrics.postsInRange;
    const videosPerWeek = primaryMetrics.videosPerWeek || 0;

    if (postsInRange === 0) {
      // No posts in this range → keep it light and focus on getting a baseline.
      baseCadence = 1;
      primaryNotes =
        "I don’t see posts in this range yet, so aim for 1 strong post this week to get a clean baseline. Once we see how it performs, we’ll ramp the cadence.";
    } else if (postsInRange > 0 && postsInRange < 5) {
      // A little bit of data → gentle ramp to start forming a pattern.
      baseCadence = 2;
      primaryNotes =
        "You’re still in early data-gathering mode. Target 2 thoughtful posts this week so we can start to see patterns and then bias more content toward what spikes.";
    } else {
      // Enough data → anchor to your actual cadence, but keep a reasonable band.
      baseCadence = Math.min(
        6,
        Math.max(3, Math.round(videosPerWeek || 3))
      );
      primaryNotes =
        "Treat this as your baseline. If a format takes off, we’ll bias more of the week toward that pattern.";
    }
  } else {
    // No metrics at all for this platform yet.
    baseCadence = 3;
    primaryNotes =
      "Once more data comes in for this channel, I’ll tighten this weekly plan around your real cadence and winners.";
  }

  const pillars =
    context.creatorProfile.brandPillars.length > 0
      ? context.creatorProfile.brandPillars
      : (["digital_nomad"] as ContentPillar[]);

  // Primary platform plan (now range-aware)
  result.push({
    platform: primary,
    postsPerWeek: baseCadence,
    pillarsToHit: pillars.slice(0, 3),
    contentTypes: [
      "story-driven verticals",
      "quick performance clips",
      "behind-the-scenes moments",
    ],
    notes: primaryNotes,
  });

  // Light plans for any other platforms with data (for future expansion)
  (["instagram", "youtube"] as Platform[]).forEach((p) => {
    if (p === primary) return;
    const m = context.platformMetrics[p];
    if (!m) return;

    result.push({
      platform: p,
      postsPerWeek: Math.max(1, Math.round(m.videosPerWeek) || 1),
      pillarsToHit: pillars.slice(0, 2),
      contentTypes: [
        "reposted winners from primary",
        "short experiments tailored to the platform",
      ],
      notes:
        "Use this as a satellite channel: recycle what works and occasionally try native experiments.",
    });
  });

  return result;
}

function buildNextPostRecommendation(
  context: StrategyContext,
  primary: Platform
): NextPostRecommendation {
  const m = context.platformMetrics[primary];
  const posts = m?.postsInRange ?? 0;
  const plays = m?.playsInRange ?? 0;
  const engagements = m?.engagementsInRange ?? 0;

  const primaryPillar = context.creatorProfile.brandPillars[0] as
    | ContentPillar
    | undefined;

  const engagementRate =
    plays > 0 ? (engagements / plays) * 100 : 0;

  const dataRequirementsMet = posts >= 10;
  const confidence: "low" | "medium" | "high" =
    posts >= 25 ? "high" : posts >= 10 ? "medium" : "low";

  const platformNice = platformLabel(primary);
  const pillarNice = primaryPillar
    ? humanizePillar(primaryPillar)
    : "your core story";

  const headline = primaryPillar
    ? `Post a ${pillarNice} clip on ${platformNice} that ties music, travel, and a real moment you’re living through right now.`
    : `Post something real on ${platformNice} that connects your music to what you’re actually doing today.`;

  const reasoning: string[] = [];

  reasoning.push(
    posts === 0
      ? `I don’t see posts in this range yet, so the first goal is to get a clean baseline by publishing something simple and honest.`
      : `You’ve published ${posts} ${
          posts === 1 ? "video" : "videos"
        } in this range. The next post should build on that momentum rather than resetting the experiment.`
  );

  if (plays > 0) {
    reasoning.push(
      `Across this range you’ve driven ~${plays.toLocaleString()} plays on ${platformNice}, with an estimated engagement rate around ${engagementRate.toFixed(
        1
      )}%. We want to keep that pattern but tighten the theme and call-to-action.`
    );
  }

  if (!dataRequirementsMet) {
    reasoning.push(
      `Because there isn’t a huge amount of data yet, I’m in learning mode — the main goal is to ship, watch what spikes, and then bias more content in that direction.`
    );
  } else {
    reasoning.push(
      `You’ve crossed the threshold where patterns start to show up, so this post leans into what’s already working while testing one new angle.`
    );
  }

  const suggestedTags = [
    "#digitalnomad",
    "#independentartist",
    "#behindthescenes",
  ];

  const suggestedCTA =
    "End the clip with a simple ask like “If this hits you, save this and I’ll keep posting from the next city.”";

  return {
    headline,
    platform: primary,
    pillar: primaryPillar,
    reasoning,
    suggestedTags,
    suggestedCTA,
    confidence,
    dataRequirementsMet,
  };
}
