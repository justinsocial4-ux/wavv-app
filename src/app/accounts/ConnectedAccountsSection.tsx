// src/app/accounts/ConnectedAccountsSection.tsx
"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type ConnectedAccount = {
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

  // These are optional because the Accounts page's ConnectedAccount
  // type doesn't always include them.
  user_id?: string | null;
  profile_ids?: string[] | null;
};

type ConnectedAccountsSectionProps = {
  accounts: ConnectedAccount[];
  loading: boolean;
  profileNamesById: Record<string, string>;
};

export function ConnectedAccountsSection({
  accounts,
  loading,
  profileNamesById,
}: ConnectedAccountsSectionProps) {
  const [connectingTikTok, setConnectingTikTok] = useState(false);

  const tiktokAccount = useMemo(
    () => accounts.find((a) => a.platform === "tiktok"),
    [accounts]
  );

  const linkedProfilesLabel = useMemo(() => {
    if (!tiktokAccount?.profile_ids || tiktokAccount.profile_ids.length === 0) {
      return "Not linked to any creator profile yet.";
    }
    const names = tiktokAccount.profile_ids
      .map((id) => profileNamesById[id])
      .filter(Boolean);
    if (names.length === 0) {
      return "Not linked to any creator profile yet.";
    }
    if (names.length === 1) return `Linked to: ${names[0]}`;
    return `Linked to: ${names.join(", ")}`;
  }, [tiktokAccount, profileNamesById]);

  async function handleConnectTikTok() {
    if (connectingTikTok) return;
    setConnectingTikTok(true);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error("[ConnectedAccountsSection] getUser error:", error);
        alert("You need to be logged in to connect TikTok.");
        setConnectingTikTok(false);
        return;
      }

      const url = `/api/tiktok/oauth/start?returnTo=/accounts&uid=${encodeURIComponent(
        user.id
      )}`;

      // Kick off OAuth flow
      window.location.href = url;
    } catch (err) {
      console.error("[ConnectedAccountsSection] handleConnectTikTok error:", err);
      alert("Something went wrong starting the TikTok connection.");
      setConnectingTikTok(false);
    }
  }

  const tiktokStatusLabel = (() => {
    if (loading) return "Checking status…";
    if (tiktokAccount) return "Connected";
    return "Not connected";
  })();

  const tiktokSubLabel = (() => {
    if (!tiktokAccount) {
      return "Short-form performance, hooks, and trend signals we’ll use once connected.";
    }
    return `Short-form performance, hooks, and trend signals we use.`;
  })();

  const tiktokMetaLabel = (() => {
    if (!tiktokAccount) return "Accounts linked: 0";
    return `Accounts linked: 1`;
  })();

  const tiktokLastRefreshed = tiktokAccount?.last_refreshed_at ?? null;

  return (
    <section className="mb-8 rounded-2xl border border-gray-850 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
      <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-400">
        Connected accounts
      </p>
      <p className="mb-4 text-xs text-gray-400">
        These channels are data sources, not a to-do list. The strategy engine
        will still decide which platforms deserve focus for a given goal, even
        if everything is connected.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {/* TikTok card */}
        <div className="flex flex-col justify-between rounded-xl border border-gray-800 bg-black/40 px-4 py-3">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  TikTok
                </p>
                <p className="text-xs text-gray-500">
                  Short-form performance, hooks, and trend signals.
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                  tiktokAccount
                    ? "bg-emerald-900/40 text-emerald-200 border border-emerald-600/60"
                    : "bg-gray-900/60 text-gray-300 border border-gray-700"
                }`}
              >
                {tiktokStatusLabel}
              </span>
            </div>

            <p className="mt-2 text-[11px] text-gray-400">{tiktokSubLabel}</p>
            <p className="mt-1 text-[11px] text-gray-500">{tiktokMetaLabel}</p>

            {tiktokLastRefreshed && (
              <p className="mt-1 text-[11px] text-gray-500">
                Last ingest:{" "}
                {new Date(tiktokLastRefreshed).toLocaleString(undefined, {
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}

            {tiktokAccount && (
              <p className="mt-1 text-[11px] text-gray-500">
                {linkedProfilesLabel}
              </p>
            )}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleConnectTikTok}
              disabled={connectingTikTok}
              className="rounded-full border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 text-xs font-medium text-gray-100 shadow-sm transition hover:border-gray-400 hover:from-gray-800 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connectingTikTok ? "Connecting…" : "Connect TikTok"}
            </button>
          </div>
        </div>

        {/* Instagram placeholder */}
        <div className="rounded-xl border border-gray-850 bg-black/30 px-4 py-3 text-xs text-gray-500">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            Instagram
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Visual storytelling and carousels. Wiring up soon.
          </p>
          <p className="mt-3 inline-flex rounded-full border border-gray-700 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400">
            Idle · Coming soon
          </p>
        </div>

        {/* YouTube placeholder */}
        <div className="rounded-xl border border-gray-850 bg-black/30 px-4 py-3 text-xs text-gray-500">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            YouTube
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Long-form + Shorts. Deeper watch-time patterns coming soon.
          </p>
          <p className="mt-3 inline-flex rounded-full border border-gray-700 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400">
            Idle · Coming soon
          </p>
        </div>
      </div>
    </section>
  );
}
