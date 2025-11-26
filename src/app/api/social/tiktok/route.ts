// src/app/api/social/tiktok/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchTikTokUserPosts, TikTokPost } from "@/lib/ensembleDataClient";

type SimplifiedPost = {
  id: string;
  caption: string;
  created_at: number | null;
  stats: {
    play_count: number;
    like_count: number;
    comment_count: number;
    share_count: number;
  };
  video_url: string | null;
  thumbnail_url: string | null;
  hashtags: string[];
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username") || "";

  if (!username) {
    return NextResponse.json(
      { ok: false, error: "Missing username param" },
      { status: 400 }
    );
  }

  try {
    // Call our Ensemble client
    const { posts } = await fetchTikTokUserPosts({
      username,
      depth: 1,
    });

    const simplified: SimplifiedPost[] = (posts || []).map((post: TikTokPost) => {
      const stats = post.stats || {};

      // Try multiple places Ensemble might put video URLs
      const videoUrls =
        post.video?.play_addr?.url_list ||
        (post as any).video?.play_addr_struct?.url_list ||
        [];

      // Caption can live in different places
      const caption: string =
        post.desc ||
        (post as any).contents?.[0]?.desc ||
        "";

      // Hashtags can live in text_extra or contents[0].text_extra
      const textExtras =
        (post as any).text_extra ||
        (post as any).contents?.[0]?.text_extra ||
        [];

      const hashtags: string[] = Array.isArray(textExtras)
        ? textExtras
            .filter((e: any) => e?.hashtag_name)
            .map((e: any) => e.hashtag_name as string)
        : [];

      return {
        id: post.id ?? "",
        caption,
        created_at: post.create_time ?? null,
        stats: {
          play_count: stats.play_count ?? 0,
          // TikTok uses "digg_count" for likes
          like_count: (stats as any).digg_count ?? 0,
          comment_count: stats.comment_count ?? 0,
          share_count: stats.share_count ?? 0,
        },
        video_url: videoUrls[0] ?? null,
        thumbnail_url: (post as any).video?.cover ?? null,
        hashtags,
      };
    });

    return NextResponse.json({
      ok: true,
      username,
      count: simplified.length,
      posts: simplified,
    });
  } catch (err: any) {
    console.error("Error in /api/social/tiktok", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
