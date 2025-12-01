// src/app/accounts/page.tsx
"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { ConnectedAccountsSection } from "./ConnectedAccountsSection";
import { ProfileList } from "@/app/accounts/ProfileList";

type ConnectedAccount = {
  id: string;
  platform: string;
  username: string | null;
  display_name: string | null;
  external_user_id: string | null;
  avatar_url: string | null;
  is_primary: boolean | null;
  last_refreshed_at: string | null;
  creator_profile_id: string | null;
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

type StatusState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

// Simple slugify helper: "Marcela Faria" -> "marcela.faria"
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9_.-]/g, "");
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function AccountsPage() {
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });

  // New profile form state
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [newBio, setNewBio] = useState("");
  const [creating, setCreating] = useState(false);

  // ---------- LOAD PROFILES & CONNECTED ACCOUNTS ----------
  async function loadProfilesAndAccounts() {
    setLoading(true);
    setStatus({ type: "idle" });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error getting user for profiles:", userError);
      setStatus({
        type: "error",
        message: "You must be logged in to view creator profiles.",
      });
      setLoading(false);
      return;
    }

    // Load creator profiles (with any attached accounts)
    const { data: profileData, error: profileError } = await supabase
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
          creator_profile_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (profileError) {
      console.error("Error loading creator_profiles:", profileError);
      setStatus({
        type: "error",
        message: "Could not load your creator profiles.",
      });
      setLoading(false);
      return;
    }

    const normalizedProfiles = (profileData ?? []).map((p) => ({
      ...p,
      connected_accounts: (p.connected_accounts ?? []) as ConnectedAccount[],
    }));

    setProfiles(normalizedProfiles);

    // Load global connected accounts (auth layer)
    const { data: accountsData, error: accountsError } = await supabase
      .from("connected_accounts")
      .select(
        `
        id,
        platform,
        username,
        display_name,
        external_user_id,
        avatar_url,
        is_primary,
        last_refreshed_at,
        creator_profile_id,
        created_at,
        updated_at
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (accountsError) {
      console.error("Error loading connected_accounts:", accountsError);
      // We still show profiles even if this fails
    }

    setConnectedAccounts((accountsData ?? []) as ConnectedAccount[]);
    setLoading(false);
  }

  useEffect(() => {
    loadProfilesAndAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- CREATE PROFILE ----------
  async function handleCreateProfile(e: FormEvent) {
    e.preventDefault();
    if (creating) return;

    const display = newDisplayName.trim();
    const rawHandle = newHandle.trim();
    const bio = newBio.trim();

    if (!display) {
      setStatus({
        type: "error",
        message: "Display name is required.",
      });
      return;
    }

    setCreating(true);
    setStatus({ type: "idle" });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error getting user for create profile:", userError);
      setStatus({
        type: "error",
        message: "You must be logged in to create a creator profile.",
      });
      setCreating(false);
      return;
    }

    const base = rawHandle || slugify(display) || "creator";
    const finalHandle = slugify(base);

    const { error } = await supabase.from("creator_profiles").insert([
      {
        user_id: user.id,
        display_name: display,
        handle: finalHandle,
        slug: finalHandle,
        bio: bio || null,
      },
    ]);

    if (error) {
      console.error("Error creating creator_profile:", error);
      setStatus({
        type: "error",
        message: "Could not create creator profile.",
      });
      setCreating(false);
      return;
    }

    setStatus({
      type: "success",
      message: "Creator profile created.",
    });

    setNewDisplayName("");
    setNewHandle("");
    setNewBio("");
    setCreating(false);

    await loadProfilesAndAccounts();
  }

  function handleCancelNewProfile() {
    setNewDisplayName("");
    setNewHandle("");
    setNewBio("");
    setStatus({ type: "idle" });
  }

  // ---------- ATTACH ACCOUNT TO PROFILE ----------
  async function handleAttachAccount(profileId: string, accountId: string) {
    if (!accountId) return;

    setStatus({ type: "loading" });

    try {
      const { error } = await supabase
        .from("connected_accounts")
        .update({ creator_profile_id: profileId })
        .eq("id", accountId);

      if (error) {
        console.error("Error attaching account to profile:", error);
        setStatus({
          type: "error",
          message: "Could not attach account to this profile.",
        });
        return;
      }

      setStatus({
        type: "success",
        message: "Account linked to profile.",
      });

      await loadProfilesAndAccounts();
    } catch (err: any) {
      console.error("Unexpected error attaching account:", err);
      setStatus({
        type: "error",
        message:
          err?.message ?? "Something went wrong while linking the account.",
      });
    }
  }

  // ---------- REFRESH TIKTOK INGEST ----------
  async function handleRefreshIngest(account: ConnectedAccount) {
    if (!account.username) {
      setStatus({
        type: "error",
        message: "This account has no username stored.",
      });
      return;
    }

    setStatus({ type: "loading" });

    try {
      const res = await fetch(
        `/api/ensemble/ingest-tiktok?username=${encodeURIComponent(
          account.username
        )}`
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Ingest failed with status ${res.status}`);
      }

      const body = await res.json().catch(() => ({}));

      setStatus({
        type: "success",
        message:
          body.postsInserted != null
            ? `Refreshed TikTok data (${body.postsInserted} posts processed).`
            : "Refreshed TikTok data.",
      });

      await loadProfilesAndAccounts();
    } catch (err: any) {
      console.error("Error refreshing TikTok data:", err);
      setStatus({
        type: "error",
        message:
          err?.message ?? "Something went wrong refreshing TikTok data.",
      });
    }
  }

  // ---------- DERIVED VALUES ----------
  const summary = useMemo(() => {
    const profileCount = profiles.length;

    let totalAccounts = 0;
    const primaryByPlatform: Record<string, number> = {};

    for (const p of profiles) {
      const accounts = p.connected_accounts ?? [];
      totalAccounts += accounts.length;

      for (const acct of accounts) {
        if (acct.is_primary) {
          const key = acct.platform.toLowerCase();
          primaryByPlatform[key] = (primaryByPlatform[key] ?? 0) + 1;
        }
      }
    }

    return { profileCount, totalAccounts, primaryByPlatform };
  }, [profiles]);

  const hasProfiles = profiles.length > 0;

  const profileNamesById = useMemo(
    () =>
      Object.fromEntries(
        profiles.map((p) => [p.id, p.display_name] as [string, string])
      ),
    [profiles]
  );

  const unlinkedAccounts = connectedAccounts.filter(
    (acct) => !acct.creator_profile_id
  );

  // ---------- RENDER ----------
  return (
    <AuthGate>
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Creator Profiles & Accounts
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Wavv’s strategy engine uses these profiles and connected
                accounts to decide where you should post next. Connected
                accounts are data sources; the strategy engine will still choose
                which channels matter for a given goal.
              </p>
            </div>

            {/* Quick TikTok connect CTA */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-sm">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Connect TikTok
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Link your TikTok account so Wavv can ingest posts and analytics.
              </p>
              <a
                href="/api/tiktok/oauth/start?returnTo=/accounts"
                className="mt-2 inline-flex items-center justify-center rounded-full border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-1.5 text-xs font-medium text-gray-100 shadow-sm transition hover:border-gray-400 hover:from-gray-800 hover:to-gray-700"
              >
                Connect TikTok
              </a>
            </div>
          </div>

          {/* Status banner */}
          {status.type === "loading" && (
            <div className="mb-4 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-3 text-sm text-gray-200">
              Working…
            </div>
          )}
          {status.type === "error" && (
            <div className="mb-4 rounded-xl border border-red-600/60 bg-red-900/40 px-4 py-3 text-sm text-red-100">
              {status.message}
            </div>
          )}
          {status.type === "success" && (
            <div className="mb-4 rounded-xl border border-emerald-600/60 bg-emerald-900/30 px-4 py-3 text-sm text-emerald-100">
              {status.message}
            </div>
          )}

          {/* Global connected accounts */}
          <ConnectedAccountsSection
            accounts={connectedAccounts}
            loading={loading}
            profileNamesById={profileNamesById}
          />

          {/* New creator profile form */}
          <section className="mb-8 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
            <p className="mb-3 text-[11px] uppercase tracking-wide text-gray-400">
              New creator profile
            </p>

            <form
              onSubmit={handleCreateProfile}
              className="space-y-3 text-sm text-gray-200"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase tracking-wide text-gray-500">
                    Display name
                  </label>
                  <input
                    type="text"
                    className="rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none transition focus:border-gray-300"
                    placeholder="e.g., Jay Hart"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase tracking-wide text-gray-500">
                    Handle / slug (optional)
                  </label>
                  <input
                    type="text"
                    className="rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none transition focus:border-gray-300"
                    placeholder="e.g., jayhart"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                  />
                  <p className="text-[11px] text-gray-500">
                    If empty, Wavv will generate one from your display name.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wide text-gray-500">
                  Bio (optional)
                </label>
                <textarea
                  className="min-h-[70px] rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none transition focus:border-gray-300"
                  placeholder="Short description of this creator profile."
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                />
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelNewProfile}
                  className="rounded-full border border-gray-700 bg-black/40 px-4 py-2 text-xs font-medium text-gray-200 hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-full border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-2 text-xs font-medium text-gray-100 shadow-sm transition hover:border-gray-400 hover:from-gray-800 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating…" : "Create profile"}
                </button>
              </div>
            </form>
          </section>

          {/* Summary tiles */}
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Creator profiles
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {loading ? "…" : summary.profileCount}
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                Each profile can have multiple connected channels.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Connected accounts
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {loading ? "…" : summary.totalAccounts}
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                TikTok, Instagram, YouTube, X, newsletter — all tracked here.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Primary channels
              </p>
              {loading ? (
                <p className="mt-2 text-3xl font-semibold">…</p>
              ) : Object.keys(summary.primaryByPlatform).length === 0 ? (
                <p className="mt-2 text-sm text-gray-400">
                  No primary channels marked yet.
                </p>
              ) : (
                <div className="mt-2 space-y-1 text-sm">
                  {Object.entries(summary.primaryByPlatform).map(
                    ([platform, count]) => (
                      <p key={platform} className="text-gray-200">
                        <span className="font-medium uppercase">
                          {platform}
                        </span>{" "}
                        · {count} primary
                      </p>
                    )
                  )}
                </div>
              )}
              <p className="mt-1 text-[11px] text-gray-500">
                The strategist will bias toward these when recommending where to
                post.
              </p>
            </div>
          </section>

          {/* Profiles & accounts list (factored out) */}
          <ProfileList
            loading={loading}
            profiles={profiles}
            hasProfiles={hasProfiles}
            unlinkedAccounts={unlinkedAccounts}
            statusType={status.type}
            onAttachAccount={handleAttachAccount}
            onRefreshIngest={handleRefreshIngest}
          />
        </div>
      </main>
    </AuthGate>
  );
}
