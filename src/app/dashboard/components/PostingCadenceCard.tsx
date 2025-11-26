"use client";

import type { WeeklyCadencePoint } from "@/app/dashboard/metrics";

type Props = {
  weeklyCadence: WeeklyCadencePoint[];
  overallPostsInRange: number;
  activeDays: number;
};

export function PostingCadenceCard({
  weeklyCadence,
  overallPostsInRange,
  activeDays,
}: Props) {
  const totalWeeks =
    activeDays > 0 ? activeDays / 7 : weeklyCadence.length || 1;

  const postsPerWeek =
    totalWeeks > 0 ? overallPostsInRange / totalWeeks : 0;

  const maxPosts = Math.max(
    ...weeklyCadence.map((w) => w.postCount),
    0
  );
  const safeMax = maxPosts || 1;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-4">
      <h2 className="mb-2 text-lg font-medium">Posting cadence</h2>
      <p className="mb-3 text-[11px] text-gray-500">
        How often you’ve actually posted in this range.
      </p>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            Videos per week (this range)
          </p>
          <p className="mt-1 text-3xl font-semibold">
            {postsPerWeek.toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            {overallPostsInRange} video
            {overallPostsInRange === 1 ? "" : "s"} over ~
            {totalWeeks.toFixed(1)} week
            {totalWeeks.toFixed(1) === "1.0" ? "" : "s"}.
          </p>
        </div>
      </div>

      {/* Tiny bar chart of posts per week */}
      {weeklyCadence.length === 0 ? (
        <p className="text-xs text-gray-500">
          No posts in this time range yet. Once you start posting, I’ll
          chart your cadence here.
        </p>
      ) : (
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
            <span>Weeks in range</span>
            <span>Posts / week</span>
          </div>
          <div className="flex gap-1">
            {weeklyCadence.map((w) => {
              const heightPct = (w.postCount / safeMax) * 100;
              return (
                <div
                  key={w.weekStart}
                  className="flex-1 rounded-t-sm bg-gray-800"
                >
                  <div
                    className="w-full rounded-t-sm bg-sky-500"
                    style={{ height: `${heightPct || 4}%` }}
                    title={`${w.weekStart}: ${w.postCount} posts`}
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            Taller bars show weeks where you shipped more videos. Aim for a
            steady baseline first, then increase volume once it feels
            sustainable.
          </p>
        </div>
      )}
    </div>
  );
}
