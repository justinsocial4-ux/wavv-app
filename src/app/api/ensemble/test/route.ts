import { NextResponse } from "next/server";
import { fetchTikTokUserPosts } from "@/lib/ensembleDataClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") ?? "bigdealjfk";

  try {
    const result = await fetchTikTokUserPosts({
      username,
      depth: 1,
    });

    const rawPosts = result.posts ?? [];

    // Map Ensemble's giant objects into something small and predictable
    const posts = rawPosts.map((p: any) => {
      return {
        id: p.id,
        caption: p.desc ?? p.contents?.[0]?.desc ?? "",
        created_at: p.create_time ?? null,
        stats: {
          play_count: p.stats?.play_count ?? 0,
          like_count: p.stats?.digg_count ?? 0,
          comment_count: p.stats?.comment_count ?? 0,
          share_count: p.stats?.share_count ?? 0,
        },
        video_url:
          p.video?.play_addr_struct?.url_list?.[0] ??
          p.video?.play_addr?.url_list?.[0] ??
          null,
        thumbnail_url: p.video?.cover ?? p.video?.origin_cover ?? null,
        hashtags:
          (p.text_extra || [])
            .filter((t: any) => t.type === 1 && t.hashtag_name)
            .map((t: any) => t.hashtag_name) || [],
      };
    });

    return NextResponse.json({
      ok: true,
      count: posts.length,
      posts,
    });
  } catch (err: any) {
    console.error("Error in /api/ensemble/test:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
