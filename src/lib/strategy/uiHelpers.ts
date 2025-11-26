// src/lib/strategy/uiHelpers.ts

import { ContentPillar, Platform } from "@/lib/creator/types";

export function platformLabel(platform: Platform): string {
  switch (platform) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
    case "twitter":
      return "X / Twitter";
    case "newsletter":
      return "Newsletter";
    default:
      return platform;
  }
}

export function humanizePillar(pillar: ContentPillar | string): string {
  switch (pillar) {
    case "digital_nomad":
      return "digital nomad life";
    case "hip_hop":
      return "hip-hop";
    case "revops_ai":
      return "RevOps + AI";
    case "mental_health":
      return "mental health and resilience";
    case "music":
      return "music";
    default:
      return pillar.toString().replace("_", " ");
  }
}
