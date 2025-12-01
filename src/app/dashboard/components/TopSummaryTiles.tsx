// src/app/dashboard/components/TopSummaryTiles.tsx
"use client";

type TopSummaryTilesProps = {
  loading: boolean;
  totalVideos: number;
  totalPlays: number;
  totalLikes: number;
};

export function TopSummaryTiles({
  loading,
  totalVideos,
  totalPlays,
  totalLikes,
}: TopSummaryTilesProps) {
  return (
    <div className="mb-5 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          Videos in range
        </p>
        <p className="mt-2 text-3xl font-semibold">
          {loading ? "…" : totalVideos}
        </p>
      </div>
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          Total plays
        </p>
        <p className="mt-2 text-3xl font-semibold">
          {loading ? "…" : totalPlays.toLocaleString()}
        </p>
      </div>
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          Total likes
        </p>
        <p className="mt-2 text-3xl font-semibold">
          {loading ? "…" : totalLikes.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
