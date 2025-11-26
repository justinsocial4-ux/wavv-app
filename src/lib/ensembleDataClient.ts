// src/lib/ensembleDataClient.ts

const ENSEMBLEDATA_ROOT = process.env.ENSEMBLEDATA_ROOT;
const ENSEMBLEDATA_TOKEN = process.env.ENSEMBLEDATA_TOKEN;

if (!ENSEMBLEDATA_ROOT) {
  throw new Error("ENSEMBLEDATA_ROOT is not set in .env.local");
}

if (!ENSEMBLEDATA_TOKEN) {
  throw new Error("ENSEMBLEDATA_TOKEN is not set in .env.local");
}

// Basic shape of a TikTok post (we can refine later if needed)
export interface TikTokPost {
  id?: string;
  desc?: string;
  create_time?: number;
  stats?: {
    play_count?: number;
    digg_count?: number;
    like_count?: number;
    comment_count?: number;
    share_count?: number;
  };
  video?: {
    play_addr?: {
      url_list?: string[];
    };
  };
  [key: string]: any; // keep flexible
}

export interface TikTokUserStats {
  followingCount?: number;
  followerCount?: number;
  heartCount?: number;
  videoCount?: number;
  diggCount?: number;
  [key: string]: any;
}

export interface TikTokUserInfo {
  user: any | null;
  stats: TikTokUserStats;
}

type FetchTikTokUserPostsOptions = {
  username: string;
  depth?: number;
  start_cursor?: number;
  oldest_createtime?: number;
  new_version?: boolean;
  download_video?: boolean;
};

function buildUrl(
  path: string,
  params: Record<string, string | number | boolean | undefined>
) {
  // Make sure we keep `/apis/` and don’t accidentally drop it
  const root = ENSEMBLEDATA_ROOT!.endsWith("/")
    ? ENSEMBLEDATA_ROOT!.slice(0, -1)
    : ENSEMBLEDATA_ROOT!;

  const url = new URL(`${root}/${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function fetchTikTokUserPosts(
  options: FetchTikTokUserPostsOptions
): Promise<{ posts: TikTokPost[]; raw: any }> {
  const {
    username,
    depth = 1,
    start_cursor = 0,
    oldest_createtime,
    new_version = true,
    download_video = false,
  } = options;

  const url = buildUrl("tt/user/posts", {
    username,
    depth,
    start_cursor,
    oldest_createtime,
    new_version,
    download_video,
    token: ENSEMBLEDATA_TOKEN!,
  });

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EnsembleData error ${res.status}: ${text}`);
  }

  const json = await res.json();

  // Ensemble sometimes wraps the array differently depending on endpoint/version
  let posts: TikTokPost[] = [];

  if (Array.isArray(json)) {
    posts = json;
  } else if (Array.isArray(json.data)) {
    posts = json.data;
  } else if (json.data && Array.isArray(json.data.data)) {
    posts = json.data.data;
  } else if (Array.isArray(json.posts)) {
    posts = json.posts;
  }

  return { posts, raw: json };
}

// NEW: fetch TikTok user info (followers, hearts, etc.)
export async function fetchTikTokUserInfo(
  username: string
): Promise<{ user: any | null; stats: TikTokUserStats; raw: any }> {
  const url = buildUrl("tt/user/info", {
    username,
    token: ENSEMBLEDATA_TOKEN!,
  });

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EnsembleData user info error ${res.status}: ${text}`);
  }

  const json = await res.json();

  // Example shape from Ensemble:
  // { data: { user: {...}, stats: { followerCount, heartCount, videoCount, ... } } }
  const data = json.data ?? json;

  const user = data.user ?? null;
  const stats: TikTokUserStats =
    (data.stats as TikTokUserStats) ??
    (user?.stats as TikTokUserStats) ??
    {};

  return { user, stats, raw: json };
}
