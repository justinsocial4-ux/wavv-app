// src/app/dashboard/components/AccountAndAvgRow.tsx
"use client";

type ProfileSnapshot = {
  follower_count: number | null;
  heart_count: number | null;
  video_count: number | null;
};

type AccountAndAvgRowProps = {
  profile: ProfileSnapshot | null;
  loading: boolean;
  avgPlaysPerVideo: number;
};

export function AccountAndAvgRow({
  profile,
  loading,
  avgPlaysPerVideo,
}: AccountAndAvgRowProps) {
  return (
    <div className="mb-10 grid gap-4 md:grid-cols-3">
      {/* Account stats */}
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4 md:col-span-2">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          Account stats
        </p>
        {profile ? (
          <div className="mt-3 flex flex-wrap gap-8 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Followers
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {profile.follower_count != null
                  ? profile.follower_count.toLocaleString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Total likes
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {profile.heart_count != null
                  ? profile.heart_count.toLocaleString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Videos posted
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {profile.video_count != null
                  ? profile.video_count.toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-500">
            No profile snapshot yet. Refresh TikTok data to pull in the latest
            stats.
          </p>
        )}
      </div>

      {/* Avg plays */}
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          Avg plays per video
        </p>
        <p className="mt-2 text-3xl font-semibold">
          {loading ? "…" : Math.round(avgPlaysPerVideo).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
