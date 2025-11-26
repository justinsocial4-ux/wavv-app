// src/lib/creator/server.ts

import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import type { Platform } from "@/lib/creator/types";

// Shape of a row from public.creator_profiles
export interface CreatorProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  handle: string;
  primary_platforms: any;
  goals: any;
  brand_pillars: string[];
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// Shape of a row from public.connected_accounts
export interface ConnectedAccountRow {
  id: string;
  user_id: string;
  creator_profile_id: string | null;
  platform: string;
  external_user_id: string | null;
  username: string | null;
  display_name: string | null;
  profile_data: any;
  created_at: string;
  updated_at: string;
}

/**
 * Get the currently-authenticated Supabase user on the server.
 * Returns null if no user.
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

/**
 * Get (or lazily create) the creator_profile row for a given user.
 * We’ll use email/metadata as a reasonable default if nothing exists yet.
 */
export async function getOrCreateCreatorProfileForUser(
  userId: string
): Promise<CreatorProfileRow> {
  const supabase = await createSupabaseServerClient();

  // 1) Try to find an existing profile
  const { data: existing, error: selectError } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Error loading creator_profile: ${selectError.message}`);
  }

  if (existing) {
    return existing as CreatorProfileRow;
  }

  // 2) Create a reasonable default profile
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Cannot create creator_profile without an authenticated user");
  }

  const user = userData.user;
  const email = user.email ?? "";
  const defaultHandle = (email.split("@")[0] || "creator").toLowerCase();

  const displayName =
    (user.user_metadata && user.user_metadata.full_name) ||
    defaultHandle;

  const { data: inserted, error: insertError } = await supabase
    .from("creator_profiles")
    .insert({
      user_id: userId,
      display_name: displayName,
      handle: defaultHandle,
      primary_platforms: JSON.stringify(["tiktok"]),
      goals: JSON.stringify([
        {
          id: "default-growth",
          label: "Grow a consistent audience",
          type: "growth",
          priority: "high",
        },
      ]),
      brand_pillars: ["digital_nomad", "music"],
      bio: "",
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    throw new Error(`Error creating creator_profile: ${insertError?.message}`);
  }

  return inserted as CreatorProfileRow;
}

/**
 * Get or create a connected account for this user + platform + username.
 * This is what we’ll attach TikTok posts/profile stats to.
 */
export async function getOrCreateConnectedAccount(
  params: {
    userId: string;
    creatorProfileId: string | null;
    platform: Platform;
    username: string;
    externalUserId?: string | null;
    displayName?: string | null;
    profileData?: any;
  }
): Promise<ConnectedAccountRow> {
  const {
    userId,
    creatorProfileId,
    platform,
    username,
    externalUserId = null,
    displayName = null,
    profileData = {},
  } = params;

  const supabase = await createSupabaseServerClient();

  // 1) Look up existing account
  const { data: existing, error: selectError } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .eq("username", username)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Error loading connected_account: ${selectError.message}`);
  }

  if (existing) {
    return existing as ConnectedAccountRow;
  }

  // 2) Create it if not found
  const { data: inserted, error: insertError } = await supabase
    .from("connected_accounts")
    .insert({
      user_id: userId,
      creator_profile_id: creatorProfileId,
      platform,
      external_user_id: externalUserId,
      username,
      display_name: displayName ?? username,
      profile_data: profileData ?? {},
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    throw new Error(`Error creating connected_account: ${insertError?.message}`);
  }

  return inserted as ConnectedAccountRow;
}

/**
 * Convenience helper:
 * - gets current user
 * - gets/creates their creator_profile
 * Returns both together so routes can wire ingestion to the right owner.
 */
export async function getUserWithProfile() {
  const user = await getCurrentUser();
  if (!user) return { user: null, creatorProfile: null };

  const creatorProfile = await getOrCreateCreatorProfileForUser(user.id);
  return { user, creatorProfile };
}
