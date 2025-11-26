// src/lib/creator/types.ts

// Which platforms Wavv can reason about (extensible later)
export type Platform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "twitter"
  | "newsletter";

// Content pillars — TEMP enum, later data-driven per user
export type ContentPillar =
  | "digital_nomad"
  | "hip_hop"
  | "revops_ai"
  | "mental_health"
  | "music";

// How confident Wavv is in a recommendation
export type RecommendationConfidence = "low" | "medium" | "high";

// ---------------- Creator profile & goals ----------------

export interface CreatorProfile {
  id: string;

  // Link back to Supabase auth user
  userId?: string;

  displayName: string;
  handle: string;

  // The main places this creator posts
  primaryPlatforms: Platform[];

  // Optional prioritization for platforms
  preferredPlatforms?: {
    platform: Platform;
    priority: "high" | "medium" | "low";
  }[];

  // Brand pillars (temporary enum; will be user-defined later)
  brandPillars: ContentPillar[];

  bio: string;
  primaryTimezone?: string;
}

// Individual goal
export interface CreatorGoal {
  id: string;
  label: string;
  type: "growth" | "monetization" | "consistency" | "experimentation";
  priority: "high" | "medium" | "low";
}

// Just an alias so we can talk about "goals" in plural
export type CreatorGoals = CreatorGoal[];

// ---------------- Connected accounts & channels ----------------

// Mirrors the new `connected_accounts` table
export interface ConnectedAccount {
  id: string;
  userId: string;
  platform: Platform;
  handle: string;
  platformUserId?: string | null;
  isPrimary: boolean;
  role?: "core" | "clips" | "promo" | "experimental" | null;
  status: "active" | "paused" | "disconnected";
}

// High-level summary of a channel for the strategy brain
export interface ChannelSummary {
  connectedAccountId: string;
  platform: Platform;
  handle: string;

  postsInRange: number;
  playsInRange: number;
  engagementsInRange: number;
  videosPerWeek: number;

  // Optional richer scores we can add later
  retentionScore?: number;
  growthScore?: number;
}

// ---------------- Weekly plans & “what to post next” ----------------

// How Wavv thinks about a one-week content plan per platform
export interface WeeklyContentPlan {
  platform: Platform;
  postsPerWeek: number;
  pillarsToHit: ContentPillar[];
  contentTypes: string[];
  notes?: string;
}

// “What to post next” object
export interface NextPostRecommendation {
  headline: string;
  platform: Platform;
  pillar?: ContentPillar;
  reasoning: string[];
  suggestedTags?: string[];
  suggestedCTA?: string;
  confidence: RecommendationConfidence;
  // true when there is enough data to be confident vs learning mode
  dataRequirementsMet: boolean;
}

// ---------------- Aggregated metrics per platform ----------------

// Raw metrics for a platform within a chosen time range
export interface PlatformMetricsSummary {
  platform: Platform;

  // Core volume + cadence
  postsInRange: number;
  playsInRange: number;
  engagementsInRange: number;
  videosPerWeek: number;

  // Richer quality/depth signals (optional for now)

  // Sharing / spread
  sharesInRange?: number; // shares, forwards, reposts, etc.
  savesInRange?: number; // "collects" / saves
  downloadsInRange?: number; // video downloads

  // Engagement quality
  avgEngagementRatePct?: number; // engagements / plays for this range

  // Retention / watch-depth (wire up later from raw tables)
  watchTimeSecondsInRange?: number;
  avgWatchTimeSecondsPerView?: number;
  completionRatePct?: number; // % of viewers who watched to (or near) the end
}

// ---------------- Strategy context ----------------

export interface StrategyContext {
  creatorProfile: CreatorProfile;
  goals: CreatorGoals;

  // Per-platform summaries for the current time range
  platformMetrics: Record<Platform, PlatformMetricsSummary | undefined>;

  // Optional multi-channel view (for cross-platform decisions later)
  channels?: ChannelSummary[];
}
