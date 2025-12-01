"use client";

import React from "react";

type ConnectedAccount = {
  id: string;
  platform: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_primary: boolean | null;
  last_refreshed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ConnectedAccountsSectionProps = {
  accounts: ConnectedAccount[];
  loading: boolean;
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

const PLATFORM_ORDER = ["tiktok", "instagram", "youtube"];

const PLATFORM_META: Record<
  string,
  { label: string; description: string; comingSoon?: boolean }
> = {
  tiktok: {
    label: "TikTok",
    description: "Short-form performance, hooks, and trend signals live here.",
  },
  instagram: {
    label: "Instagram",
    description: "Visual storytelling and carousels. Wiring up soon.",
    comingSoon: true,
  },
  youtube: {
    label: "YouTube",
    description: "Long-form + Shorts. Deeper watch-time patterns coming soon.",
    comingSoon: true,
  },
};

export function ConnectedAccountsSection({
  accounts,
  loading,
}: ConnectedAccountsSectionProps) {
  // ADHD-friendly constraint:
  // - 1 clear block
  // - obvious status pill per platform
  // - at-a-glance understanding, no wall of text
  const byPlatform: Record<string, ConnectedAccount[]> = {};

  for (const acct of accounts) {
    const key = (acct.platform ?? "").toLowerCase();
    if (!byPlatform[key]) byPlatform[key] = [];
    byPlatform[key].push(acct);
  }

  return (
    <section className="mb-8 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            Connected accounts
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-50">
            Where Wavv can listen & learn
          </h2>
          <p className="mt-1 text-xs text-gray-400 max-w-xl">
            These channels are data sources, not a to-do list. The strategy
            engine will still decide which platforms deserve focus for a given
            goal, even if everything is connected.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLATFORM_ORDER.map((platformKey) => {
          const platformAccounts = byPlatform[platformKey] ?? [];
          const isConnected = platformAccounts.length > 0;
          const meta = PLATFORM_META[platformKey];

          // Prefer the primary account if there is one
          const primary =
            platformAccounts.find((a) => a.is_primary) ?? platformAccounts[0];

          const displayName =
            primary?.display_name ?? primary?.username ?? null;

          return (
            <div
              key={platformKey}
              className="flex flex-col justify-between rounded-2xl border border-gray-800 bg-black/40 px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">
                    {meta?.label ?? platformKey.toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-100">
                    {isConnected
                      ? displayName
                        ? `Connected as ${displayName}`
                        : "Connected"
                      : "Not connected"}
                  </p>
                </div>

                <span
                  className={[
                    "inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium",
                    isConnected
                      ? "border border-emerald-500/60 bg-emerald-900/30 text-emerald-100"
                      : "border border-gray-700 bg-gray-900/60 text-gray-300",
                  ].join(" ")}
                >
                  {isConnected ? "Listening" : "Idle"}
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                {meta?.description ??
                  "This platform will feed data into the strategy engine once connected."}
              </p>

              {isConnected && (
                <p className="mt-3 text-[11px] text-gray-500">
                  Last refreshed:{" "}
                  {formatDate(primary?.last_refreshed_at ?? primary?.updated_at)}
                  <br />
                  Accounts linked: {platformAccounts.length}
                </p>
              )}

              {meta?.comingSoon && (
                <p className="mt-3 text-[10px] uppercase tracking-wide text-gray-600">
                  Coming soon
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
