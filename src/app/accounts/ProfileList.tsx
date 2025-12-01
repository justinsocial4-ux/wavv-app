// src/app/accounts/ProfileList.tsx
"use client";

import { useState } from "react";

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

type StatusType = "idle" | "loading" | "error" | "success";

type ProfileListProps = {
  loading: boolean;
  profiles: CreatorProfile[];
  hasProfiles: boolean;
  unlinkedAccounts: ConnectedAccount[];
  statusType: StatusType;
  onAttachAccount: (profileId: string, accountId: string) => Promise<void>;
  onRefreshIngest: (account: ConnectedAccount) => Promise<void>;
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function ProfileList({
  loading,
  profiles,
  hasProfiles,
  unlinkedAccounts,
  statusType,
  onAttachAccount,
  onRefreshIngest,
}: ProfileListProps) {
  // Per-profile dropdown selection for "link account"
  const [pendingAttach, setPendingAttach] = useState<Record<string, string>>(
    {}
  );

  if (loading) {
    return (
      <section>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-6 text-sm text-gray-400">
          Loading your profiles…
        </div>
      </section>
    );
  }

  if (!hasProfiles) {
    return (
      <section>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-6 text-sm text-gray-400">
          You don’t have any creator profiles yet. Use the “Create creator
          profile” form above to set up your first one. Once you connect
          accounts, Wavv will attach your channels so the strategy engine can
          make multi-platform decisions.
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="space-y-6">
        {profiles.map((profile) => {
          const accounts = profile.connected_accounts ?? [];
          const availableAccounts = unlinkedAccounts;
          const selectedId = pendingAttach[profile.id] ?? "";

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
                    <p className="text-xs text-gray-400">@{profile.slug}</p>
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

              {/* Attach global accounts to this profile */}
              {availableAccounts.length > 0 && (
                <div className="mt-3 rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-xs text-gray-200">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">
                    Link a connected account to this profile
                  </p>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <select
                      className="flex-1 rounded-xl border border-gray-700 bg-black/60 px-3 py-2 text-xs outline-none focus:border-gray-300"
                      value={selectedId}
                      onChange={(e) =>
                        setPendingAttach((prev) => ({
                          ...prev,
                          [profile.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select a connected account…</option>
                      {availableAccounts.map((acct) => (
                        <option key={acct.id} value={acct.id}>
                          {acct.platform.toUpperCase()} ·{" "}
                          {acct.display_name ??
                            acct.username ??
                            acct.external_user_id?.slice(0, 8) ??
                            "Unnamed"}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedId || statusType === "loading"}
                      onClick={async () => {
                        if (!selectedId) return;
                        await onAttachAccount(profile.id, selectedId);
                        setPendingAttach((prev) => ({
                          ...prev,
                          [profile.id]: "",
                        }));
                      }}
                      className="mt-2 inline-flex items-center justify-center rounded-full border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 text-xs font-medium text-gray-100 shadow-sm transition hover:border-gray-400 hover:from-gray-800 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-60 md:mt-0"
                    >
                      Link account
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    One connected account can belong to one creator profile. You
                    can change this later from the accounts table in Supabase if
                    needed.
                  </p>
                </div>
              )}

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
                          {acct.display_name ?? acct.username ?? "(no name)"}
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
                          onClick={() => onRefreshIngest(acct)}
                          disabled={statusType === "loading"}
                          className="rounded-full border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 text-xs font-medium text-gray-100 shadow-sm transition hover:border-gray-400 hover:from-gray-800 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {statusType === "loading"
                            ? "Refreshing…"
                            : "Refresh TikTok data"}
                        </button>
                      )}
                      {acct.platform !== "tiktok" && (
                        <p className="text-[11px] text-gray-500">
                          Ingest for {acct.platform} will be wired up soon.
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
    </section>
  );
}
