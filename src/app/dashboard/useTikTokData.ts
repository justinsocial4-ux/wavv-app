// src/app/dashboard/useTikTokData.ts
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

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

export function useTikTokData(username: string) {
  const [posts, setPosts] = useState<TikTokPostRow[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    // Posts
    const { data: postRows, error: postsError } = await supabase
      .from("tiktok_posts")
      .select("*")
      .eq("username", username)
      .order("p_created_at", { ascending: false });

    if (postsError) {
      console.error("[useTikTokData] Post load error:", postsError);
      setError("Could not load TikTok posts");
      setLoading(false);
      return;
    }

    setPosts(postRows ?? []);

    // Profile
    const { data: profileRows, error: profileError } = await supabase
      .from("tiktok_profile_stats")
      .select("*")
      .eq("username", username)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (profileError) {
      console.error("[useTikTokData] Profile load error:", profileError);
    } else {
      setProfile(profileRows?.[0] ?? null);
    }

    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/ensemble/ingest-tiktok?username=${encodeURIComponent(
          username
        )}`
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Ingest failed (${res.status}): ${txt}`);
      }

      await loadData();
    } catch (err: any) {
      console.error("[useTikTokData] Refresh error:", err);
      setError(err?.message ?? "Error refreshing data");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [username]);

  return {
    posts,
    profile,
    loading,
    refreshing,
    error,
    handleRefresh,
  };
}
