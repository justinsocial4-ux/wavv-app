// src/app/dashboard/components/DashboardHeader.tsx
"use client";

type DashboardHeaderProps = {
  username: string;
  refreshing: boolean;
  onRefresh: () => void;
};

export function DashboardHeader({
  username,
  refreshing,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Wavv Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          TikTok performance for{" "}
          <span className="font-medium">@{username}</span>
        </p>
      </div>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="rounded-full border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-2 text-sm font-medium shadow-sm transition hover:border-gray-400 hover:from-gray-800 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {refreshing ? "Refreshing…" : "Refresh TikTok data"}
      </button>
    </div>
  );
}
