// src/lib/creator/jayProfile.ts

import {
  ContentPillar,
  CreatorGoal,
  CreatorGoals,
  CreatorProfile,
  Platform,
} from "./types";

export const jayCreatorProfile: CreatorProfile = {
  id: "jay",
  displayName: "Jay Hart",
  handle: "bigdealjfk",
  primaryPlatforms: ["tiktok"],
  preferredPlatforms: [
    { platform: "tiktok", priority: "high" },
    { platform: "instagram", priority: "medium" },
    { platform: "youtube", priority: "low" },
  ],
  brandPillars: [
    "digital_nomad",
    "music",
    "mental_health",
  ] as ContentPillar[],
  bio: "Nomadic hip-hop / R&B artist and RevOps brain building in public.",
};

export const jayCreatorGoals: CreatorGoals = [
  {
    id: "g1",
    label: "Grow a consistent audience on TikTok",
    type: "growth",
    priority: "high",
  },
  {
    id: "g2",
    label: "Build a repeatable content cadence that fits a global nomad schedule",
    type: "consistency",
    priority: "high",
  },
  {
    id: "g3",
    label: "Test content that ties music, travel, and mental health together",
    type: "experimentation",
    priority: "medium",
  },
];

export type { CreatorProfile, CreatorGoal, CreatorGoals, Platform, ContentPillar };
