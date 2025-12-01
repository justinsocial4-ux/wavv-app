// src/app/accounts/ConnectedAccountsSection.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Keep this in sync with what AccountsPage passes in.
 * Even if we don't use all of these yet, typing them avoids TS errors.
 */
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
  // you can add creator_profile_id etc. later if needed
};

type ConnectedAccountsSectionProps = {
  accounts: ConnectedAccount[];
  loading: boolean;
  profileNamesById: Record<string, string>;
};

export function ConnectedAccountsSection(
  _props: ConnectedAccountsSectionProps
) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setLoadingUser(true);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error) {
        console.error("[ConnectedAccountsSection] getUser error:", error);
        setUserId(null);
      } else {
        setUserId(user?.id ?? null);
      }

      setLoadingUser(false);
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleConnectTikTok = async () => {
    if (connecting) return;

    setConnecting(true);

    try {
      let uid = userId;

      // If we somehow don't have a user yet, try once more
      if (!uid) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          console.error(
            "[ConnectedAccountsSection] No logged-in user to connect TikTok:",
            error
          );
          window.location.href = "/login";
          return;
        }

        uid = user.id;
        setUserId(uid);
      }

      const url = `/api/tiktok/oauth/start?returnTo=/accounts&uid=${encodeURIComponent(
        uid!
      )}`;

      window.location.href = url;
    } catch (err) {
      console.error(
        "[ConnectedAccountsSection] Error starting TikTok OAuth:",
        err
      );
      setConnecting(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Connected accounts
          </p>
          <p className="mt-1 text-sm text-gray-300">
            These channels are data sources, not a to-do list. The strategy
            engine will still decide which platforms deserve focus for a given
            goal, even if everything is connected.
          </p>
        </div>

        <button
          type="button"
          onClick={handleConnectTikTok}
          disabled={loadingUser || connecting}
          className="rounded-full border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 text-xs font-medium text-gray-100 shadow-sm transition hover:border-gray-400 hover:from-gray-800 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connecting ? "Connecting…" : "Connect TikTok"}
        </button>
      </div>

      {/* Simple placeholder cards for now; we’ll wire real status later. */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-gray-300">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            TikTok
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Short-form performance, hooks, and trend signals we listen to.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-gray-500">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            Instagram
          </p>
          <p className="mt-1 text-xs text-gray-500">Coming soon.</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-gray-500">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            YouTube
          </p>
          <p className="mt-1 text-xs text-gray-500">Coming soon.</p>
        </div>
      </div>
    </section>
  );
}
