// src/app/dashboard/[profileId]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardShell from "../DashboardShell";
import { supabase } from "@/lib/supabaseClient";

type ConnectedAccount = {
  id: string;
  platform: string;
  username: string | null;
  display_name: string | null;
  external_user_id: string | null;
  avatar_url: string | null;
  is_primary: boolean | null;
  last_refreshed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CreatorProfile = {
  id: string;
  display_name: string;
  slug: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  connected_accounts: ConnectedAccount[] | null;
};

type ProfileDashboardPageProps = {
  params: {
    profileId: string;
  };
};

export default function ProfileDashboardPage({
  params,
}: ProfileDashboardPageProps) {
  const { profileId } = params;

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("creator_profiles")
        .select(
          `
          id,
          display_name,
          slug,
          bio,
          created_at,
          updated_at,
          connected_accounts (
            id,
            platform,
            username,
            display_name,
            external_user_id,
            avatar_url,
            is_primary,
            last_refreshed_at,
            created_at,
            updated_at
          )
        `
        )
        .eq("id", profileId)
        .single();

      if (cancelled) return;

      if (error) {
        console.error("Error loading creator_profile for dashboard:", error);
        setError("Could not load this creator profile.");
        setProfile(null);
        setLoading(false);
        return;
      }

      const normalized: CreatorProfile = {
        ...data,
        connected_accounts: (data.connected_accounts ?? []) as ConnectedAccount[],
      };

      setProfile(normalized);
      setLoading(false);
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  // Decide which TikTok account to drive this dashboard from
  const tiktokUsername = useMemo(() => {
    if (!profile?.connected_accounts) return null;

    const accounts = profile.connected_accounts;

    const tiktokAccounts = accounts.filter(
      (acct) => acct.platform.toLowerCase() === "tiktok"
    );

    if (tiktokAccounts.length === 0) return null;

    const primary =
      tiktokAccounts.find((acct) => Boolean(acct.is_primary)) ??
      tiktokAccounts[0];

    return primary.username ?? null;
  }, [profile]);

  // ----- Render states -----
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-sm text-gray-400">Loading dashboard…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-sm text-gray-400">
            This creator profile could not be found.
          </p>
        </div>
      </main>
    );
  }

  if (!tiktokUsername) {
    // Future behavior: a true multi-platform dashboard that can operate
    // even without TikTok, aggregating metrics across IG/YT/X, etc.
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 py-10 space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile.display_name}
          </h1>
          <p className="text-sm text-gray-400">
            This profile doesn’t have a linked TikTok account yet, so the TikTok
            dashboard view can’t load.
          </p>
          <p className="text-xs text-gray-500">
            Once you connect TikTok as a channel for this profile, Wavv will
            pull your posts, compute performance metrics, and feed the strategy
            engine for TikTok-specific recommendations.
          </p>
        </div>
      </main>
    );
  }

  // Happy path: we have a profile and a TikTok username → drive DashboardShell
  return (
    <DashboardShell
      profileId={profile.id}
      username={tiktokUsername}
    />
  );
}
