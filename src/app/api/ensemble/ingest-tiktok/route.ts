// src/app/api/ensemble/ingest-tiktok/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchTikTokUserPosts } from "@/lib/ensembleDataClient";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

import {
  getUserWithProfile,
  getOrCreateConnectedAccount,
} from "@/lib/creator/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Missing ?username=" },
      { status: 400 }
    );
  }

  // 1) Get user + creator_profile from auth
  const { user, creatorProfile } = await getUserWithProfile();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // 2) Prepare Supabase client
  const supabase = await createSupabaseServerClient();

  // 3) Get TikTok posts via Ensemble
  let posts: any[] = [];
  let rawProfile: any = null;
  let rawEnvelope: any = null;

  try {
    // NOTE: current signature expects an options object, not a plain string
    const { posts: fetchedPosts, raw } = await fetchTikTokUserPosts({
      username,
    });

    posts = fetchedPosts ?? [];
    rawEnvelope = raw ?? null;

    // Try to pull a profile-ish object out of the raw payload.
    // This is intentionally defensive — shape can change.
    rawProfile =
      rawEnvelope?.profile ??
      rawEnvelope?.user ??
      rawEnvelope?.author ??
      null;
  } catch (err: any) {
    console.error("Error calling fetchTikTokUserPosts:", err);
    return NextResponse.json(
      { error: "Failed to fetch from Ensemble", details: err?.message },
      { status: 500 }
    );
  }

  // 4) Ensure this TikTok account is tracked as a connected_account
  const connected = await getOrCreateConnectedAccount({
    userId: user.id,
    creatorProfileId: creatorProfile?.id ?? null,
    platform: "tiktok",
    username,
    externalUserId:
      rawProfile?.tiktok_id ??
      rawProfile?.id ??
      rawProfile?.secUid ??
      null,
    displayName:
      rawProfile?.nickname ??
      rawProfile?.uniqueId ??
      rawProfile?.username ??
      username,
    profileData: rawProfile ?? rawEnvelope ?? {},
  });

  // 5) Upsert profile stats (best-effort; all fields nullable)
  if (rawProfile) {
    await supabase.from("tiktok_profile_stats").upsert(
      {
        user_id: user.id,
        connected_account_id: connected.id,

        follower_count:
          rawProfile.follower_count ??
          rawProfile.followers ??
          rawProfile.followerCount ??
          null,
        heart_count:
          rawProfile.heart_count ??
          rawProfile.heartCount ??
          rawProfile.likes ??
          null,
        digg_count: rawProfile.digg_count ?? null,
        video_count:
          rawProfile.video_count ??
          rawProfile.videoCount ??
          rawProfile.videos ??
          null,
        following_count:
          rawProfile.following_count ??
          rawProfile.following ??
          null,
        avatar_url:
          rawProfile.avatar_url ??
          rawProfile.avatarThumb ??
          rawProfile.avatarMedium ??
          null,
        bio:
          rawProfile.bio ??
          rawProfile.signature ??
          rawProfile.description ??
          null,
      },
      {
        onConflict: "connected_account_id",
      }
    );
  }

  // 6) Upsert posts
  const cleanPosts = posts.map((p) => ({
    tiktok_id: p.id ?? p.aweme_id ?? null,
    username,
    user_id: user.id,
    connected_account_id: connected.id,

    caption: p.caption ?? p.desc ?? null,
    created_at: p.createTime
      ? new Date(p.createTime * 1000).toISOString()
      : p.created_at ?? null,
    p_created_at: p.p_created_at ?? null,

    play_count:
      p.play_count ?? p.stats?.playCount ?? p.stats?.play_count ?? null,
    like_count:
      p.like_count ?? p.stats?.diggCount ?? p.stats?.likeCount ?? null,
    comment_count:
      p.comment_count ??
      p.stats?.commentCount ??
      p.stats?.comment_count ??
      null,
    share_count:
      p.share_count ?? p.stats?.shareCount ?? p.stats?.share_count ?? null,

    video_url: p.video_url ?? p.playUrl ?? null,
    thumbnail_url: p.thumbnail_url ?? p.cover ?? p.dynamicCover ?? null,
    hashtags:
      p.hashtags ??
      p.challenge_names ??
      p.challenges?.map((c: any) => c.title) ??
      [],

    collect_count: p.collect_count ?? p.stats?.collectCount ?? null,
    download_count: p.download_count ?? p.stats?.downloadCount ?? null,
    forward_count: p.forward_count ?? null,
    repost_count: p.repost_count ?? null,
    whatsapp_share_count: p.whatsapp_share_count ?? null,
  }));

  // Insert in batches for safety
  const batchSize = 300;
  for (let i = 0; i < cleanPosts.length; i += batchSize) {
    const slice = cleanPosts.slice(i, i + batchSize);
    await supabase.from("tiktok_posts").upsert(slice, {
      onConflict: "tiktok_id,user_id,connected_account_id",
    });
  }

  // 7) Log ingest run (store the raw envelope for debugging)
  await supabase.from("tiktok_ingest_runs").insert({
    user_id: user.id,
    connected_account_id: connected.id,
    username,
    post_count: posts.length,
    raw_json: rawEnvelope ?? {},
  });

  return NextResponse.json({
    ok: true,
    username,
    postsInserted: posts.length,
    profileCaptured: !!rawProfile,
    connectedAccountId: connected.id,
  });
}
