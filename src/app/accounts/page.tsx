// src/app/accounts/page.tsx
"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";

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

export default function AccountsPage() {
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });

  // New profile form state
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [newBio, setNewBio] = useState("");
  const [creating, setCreating] = useState(false);

  // ---------- LOAD PROFILES FOR LOGGED-IN USER ----------
  async function loadProfiles() {
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
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading creator_profiles:", error);
      setStatus({
        type: "error",
        message: "Could not load your creator profiles.",
      });
      setLoading(false);
      return;
    }

    const normalized = (data ?? []).map((p) => ({
      ...p,
      connected_accounts: (p.connected_accounts ?? []) as ConnectedAccount[],
    }));

    setProfiles(normalized);
    setLoading(false);
  }

  useEffect(() => {
    loadProfiles();
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

    // Decide final handle:
    // 1) If user typed one, slugify it
    // 2) Else derive from display name
    // 3) Fallback to "creator" if everything fails
    const base =
      rawHandle ||
      slugify(display) ||
      "creator";

    const finalHandle = slugify(base);

    const { error } = await supabase.from("creator_profiles").insert([
      {
        user_id: user.id,
        display_name: display,
        handle: finalHandle, // 🔥 required NOT NULL column
        slug: finalHandle,   // keep slug in sync for now
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

    await loadProfiles();
  }

  function handleCancelNewProfile() {
    setNewDisplayName("");
    setNewHandle("");
    setNewBio("");
    setStatus({ type: "idle" });
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

      await loadProfiles();
    } catch (err: any) {
      console.error("Error refreshing TikTok data:", err);
      setStatus({
        type: "error",
        message:
          err?.message ?? "Something went wrong refreshing TikTok data.",
      });
    }
  }

  // ---------- HELPERS ----------
  function formatDate(iso: string | null | undefined) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

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
                Wavv’s strategy engine uses these profiles and connected accounts
                to decide where you should post next.
              </p>
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

          {/* Profiles & accounts list */}
          <section>
            {loading && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-6 text-sm text-gray-400">
                Loading your profiles…
              </div>
            )}

            {!loading && !hasProfiles && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-6 text-sm text-gray-400">
                You don’t have any creator profiles yet. Use the “Create creator
                profile” form above to set up your first one. Once you connect
                accounts, Wavv will attach your channels so the strategy engine
                can make multi-platform decisions.
              </div>
            )}

            {!loading && hasProfiles && (
              <div className="space-y-6">
                {profiles.map((profile) => {
                  const accounts = profile.connected_accounts ?? [];
                  return (
                    <div
                      key={profile.id}
                      className="rounded-2xl border border-gray-800 bg-gray-900/60 px-5 py-4"
                    >
                      {/* Profile header */}
                      <div className="flex flex-col gap-2 border-b border-gray-800 pb-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Creator profile
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-50">
                            {profile.display_name}
                          </p>
                          {profile.slug && (
                            <p className="text-xs text-gray-400">
                              @{profile.slug}
                            </p>
                          )}
                          {profile.bio && (
                            <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                              {profile.bio}
                            </p>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Created: {formatDate(profile.created_at)}
                          <br />
                          Updated: {formatDate(profile.updated_at)}
                        </p>
                      </div>

                      {/* Accounts for this profile */}
                      <div className="mt-3 space-y-3">
                        {accounts.length === 0 && (
                          <p className="text-xs text-gray-500">
                            No accounts linked to this profile yet.
                          </p>
                        )}

                        {accounts.map((acct) => (
                          <div
                            key={acct.id}
                            className="flex flex-col justify-between gap-3 rounded-xl border border-gray-800 bg-black/40 px-4 py-3 md:flex-row md:items-center"
                          >
                            <div className="flex items-center gap-3">
                              {acct.avatar_url && (
                                <img
                                  src={acct.avatar_url}
                                  alt={acct.display_name ?? acct.username ?? ""}
                                  className="h-9 w-9 rounded-full object-cover"
                                />
                              )}
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                                  {acct.platform.toUpperCase()}
                                  {acct.is_primary ? " • PRIMARY" : ""}
                                </p>
                                <p className="mt-1 text-sm font-medium text-gray-50">
                                  {acct.display_name ??
                                    acct.username ??
                                    "(no name)"}
                                </p>
                                {acct.username && (
                                  <p className="text-xs text-gray-400">
                                    @{acct.username}
                                  </p>
                                )}
                                <p className="mt-1 text-[11px] text-gray-500">
                                  Linked: {formatDate(acct.created_at)}
                                  {" • "}
                                  Updated: {formatDate(acct.updated_at)}
                                  {acct.last_refreshed_at && (
                                    <>
                                      {" • "}
                                      Last ingest:{" "}
                                      {formatDate(acct.last_refreshed_at)}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-row flex-wrap gap-2 md:flex-col md:items-end">
                              {acct.platform === "tiktok" && acct.username && (
                                <button
                                  onClick={() => handleRefreshIngest(acct)}
                                  disabled={status.type === "loading"}
                                  className="rounded-full border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 text-xs font-medium text-gray-100 shadow-sm transition hover:border-gray-400 hover:from-gray-800 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {status.type === "loading"
                                    ? "Refreshing…"
                                    : "Refresh TikTok data"}
                                </button>
                              )}
                              {acct.platform !== "tiktok" && (
                                <p className="text-[11px] text-gray-500">
                                  Ingest for {acct.platform} will be wired up
                                  soon.
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </AuthGate>
  );
}
