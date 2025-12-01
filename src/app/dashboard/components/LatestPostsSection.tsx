// src/app/dashboard/components/LatestPostsSection.tsx
"use client";

type LatestPost = {
  caption: string | null;
  play_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
};

type LatestPostsSectionProps = {
  loading: boolean;
  latestPost: LatestPost | null;
};

export function LatestPostsSection({
  loading,
  latestPost,
}: LatestPostsSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-medium">Latest TikTok posts</h2>

      {loading && !latestPost && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-6 text-sm text-gray-400">
          Loading posts…
        </div>
      )}

      {!loading && !latestPost && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-6 text-sm text-gray-400">
          No posts found in this time range. Try expanding the range or hit
          “Refresh TikTok data”.
        </div>
      )}

      {latestPost && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 px-5 py-4">
          <p className="text-sm font-medium">
            {latestPost.caption || "(No caption)"}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Plays: {latestPost.play_count ?? 0} · Likes:{" "}
            {latestPost.like_count ?? 0} · Comments:{" "}
            {latestPost.comment_count ?? 0} · Shares:{" "}
            {latestPost.share_count ?? 0}
          </p>
        </div>
      )}
    </section>
  );
}
