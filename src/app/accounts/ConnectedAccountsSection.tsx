// src/app/accounts/ConnectedAccountsSection.tsx
"use client";

import { useState } from "react";
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
  // Optional for now – we’ll normalize this later when we wire profile linking
  profile_ids?: string[];
};

type ConnectedAccountsSectionProps = {
  accounts: ConnectedAccount[];
  loading: boolean;
  profileNamesById: Record<string, string>;
};

type ButtonState = "idle" | "loading" | "error";

export function ConnectedAccountsSection({
  accounts,
  loading,
  profileNamesById,
}: ConnectedAccountsSectionProps) {
  const [connectState, setConnectState] = useState<ButtonState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConnectTikTok() {
    if (connectState === "loading") return;

    setConnectState("loading");
    setErrorMessage(null);

    try {
      // 1) Get the current Supabase user on the client
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("[ConnectTikTok] getUser error:", error);
        setConnectState("error");
        setErrorMessage("Could not determine who is logged in.");
        return;
      }

      if (!user) {
        // Not logged in → send to login
        window.location.href = "/login";
        return;
      }

      // 2) Build the URL to our OAuth start route
      const params = new URLSearchParams({
        returnTo: "/accounts",
        uid: user.id,
      });

      const startUrl = `/api/tiktok/oauth/start?${params.toString()}`;

      // 3) Kick off the OAuth flow
      window.location.href = startUrl;
    } catch (err: any) {
      console.error("[ConnectTikTok] Unexpected error:", err);
      setConnectState("error");
      setErrorMessage("Something went wrong starting TikTok connect.");
    }
  }

  const tiktokAccount = accounts.find(
    (a) => a.platform.toLowerCase() === "tiktok"
  );
  const hasTikTok = !!tiktokAccount;

  const tiktokLinkedProfiles: string[] =
    tiktokAccount?.profile_ids?.map((id) => profileNamesById[id] || id) ?? [];

  return (
    <section className="mb-8 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            Connected accounts
          </p>
          <p className="mt-1 text-xs text-gray-500">
            These channels are data sources, not a to-do list. The strategy
            engine will still decide which platforms deserve focus for a given
            goal, even if everything is connected.
          </p>
        </div>
        <button
          type="button"
          onClick={handleConnectTikTok}
          disabled={connectState === "loading"}
          className="rounded-full border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 text-xs font-medium text-gray-100 shadow-sm transition hover:border-gray-400 hover:from-gray-800 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connectState === "loading" ? "Connecting…" : "Connect TikTok"}
        </button>
      </div>

      {connectState === "error" && errorMessage && (
        <div className="mb-3 rounded-xl border border-red-600/60 bg-red-900/40 px-3 py-2 text-[11px] text-red-100">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {/* TikTok card */}
        <div className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                TikTok
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Short-form performance, hooks, and trend signals we’ll tap.
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                hasTikTok
                  ? "border border-emerald-500/60 bg-emerald-900/40 text-emerald-100"
                  : "border border-gray-700 bg-gray-900/60 text-gray-300"
              }`}
            >
              {hasTikTok ? "Listening" : "Not connected"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            {loading
              ? "Checking TikTok connection…"
              : hasTikTok
              ? "Last refreshed: " +
                (tiktokAccount?.last_refreshed_at
                  ? new Date(tiktokAccount.last_refreshed_at).toLocaleString()
                  : "unknown")
              : "Connect to start ingesting TikTok posts and analytics."}
          </p>
          {hasTikTok && (
            <p className="mt-1 text-[11px] text-gray-500">
              Linked to:{" "}
              {tiktokLinkedProfiles.length > 0
                ? tiktokLinkedProfiles.join(", ")
                : "no profiles yet"}
            </p>
          )}
        </div>

        {/* Instagram placeholder */}
        <div className="rounded-xl border border-gray-850 bg-black/30 px-4 py-3 text-xs text-gray-500">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            Instagram
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Visual storytelling and carousels. Wiring up soon.
          </p>
          <p className="mt-3 inline-flex rounded-full border border-gray-700 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-500">
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
          <p className="mt-3 inline-flex rounded-full border border-gray-700 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-500">
            Idle · Coming soon
          </p>
        </div>
      </div>
    </section>
  );
}
