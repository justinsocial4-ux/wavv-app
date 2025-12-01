// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabaseClient";
import { useProfileStore } from "@/lib/profileStore";
import DashboardShell from "./DashboardShell";

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

type FlattenedAccount = MinimalConnectedAccount & {
  creator_profile_id: string;
};

function activeUsernameSafe(u: string) {
  // Strip leading @ if we ever store it that way
  return u.startsWith("@") ? u.slice(1) : u;
}

export default function DashboardPage() {
  const { activeProfileId, setActiveProfileId } = useProfileStore();

  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [activeAccount, setActiveAccount] = useState<FlattenedAccount | null>(
    null
  );

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

      // Flatten all accounts across profiles, tagging which profile they belong to
      const allAccounts: FlattenedAccount[] = typedProfiles.flatMap((p) =>
        (p.connected_accounts ?? []).map((a) => ({
          ...a,
          creator_profile_id: p.id,
        }))
      );

      // Filter to TikTok
      const tiktokAccounts = allAccounts.filter(
        (a) => a.platform && a.platform.toLowerCase() === "tiktok"
      );

      let chosen: FlattenedAccount | null = null;

      // 1) If we have an active profile, prefer TikTok accounts for that profile
      if (activeProfileId) {
        const accountsForActive = tiktokAccounts.filter(
          (a) => a.creator_profile_id === activeProfileId
        );

        if (accountsForActive.length > 0) {
          const primaryForProfile = accountsForActive.find((a) => a.is_primary);
          chosen = primaryForProfile ?? accountsForActive[0];
        }
      }

      // 2) Fallback: use primary TikTok overall, else first TikTok
      if (!chosen && tiktokAccounts.length > 0) {
        const primaryGlobal = tiktokAccounts.find((a) => a.is_primary);
        chosen = primaryGlobal ?? tiktokAccounts[0];

        // If we didn’t have an active profile yet, sync it to this account’s profile
        if (!activeProfileId && chosen) {
          setActiveProfileId(chosen.creator_profile_id);
        }
      }

      setActiveAccount(chosen);
      setAccountLoading(false);
    }

    loadAccountsForUser();

    return () => {
      cancelled = true;
    };
  }, [activeProfileId, setActiveProfileId]);

  // --------- Render states ---------

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

  const effectiveUsername =
    activeAccount?.username && activeAccount.username.trim().length > 0
      ? activeUsernameSafe(activeAccount.username)
      : null;

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

  // --------- Main dashboard ---------

  return (
    <AuthGate>
      <DashboardShell
        profileId={activeAccount.creator_profile_id}
        username={effectiveUsername}
      />
    </AuthGate>
  );
}
