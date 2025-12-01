// src/app/api/tiktok/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI!;

type TikTokTokenResponse = {
  access_token: string;
  refresh_token: string;
  open_id: string;
  scope?: string;
  expires_in?: number;
  refresh_expires_in?: number;
};

type TikTokUserInfoResponse = {
  data?: {
    user?: {
      open_id?: string;
      username?: string;
      display_name?: string;
      avatar_url?: string;
      [key: string]: any;
    };
  };
  error?: {
    code?: string | number;
    message?: string;
  };
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const returnTo = url.searchParams.get("returnTo") ?? "/accounts";

  if (!code) {
    return NextResponse.json(
      { error: "Missing OAuth code from TikTok" },
      { status: 400 }
    );
  }

  if (!state) {
    return NextResponse.json(
      { error: "Missing state when returning from TikTok" },
      { status: 400 }
    );
  }

  // --- 1) Decode state payload to get our user_id ---
  let userId: string | null = null;
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.uid === "string") {
      userId = parsed.uid;
    }
  } catch (err) {
    console.error("[TikTok OAuth callback] Failed to decode state:", err);
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Missing user id when returning from TikTok" },
      { status: 400 }
    );
  }

  // --- 2) Exchange code -> access token + open_id ---
  let tokenJson: TikTokTokenResponse;
  try {
    const tokenRes = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: TIKTOK_CLIENT_KEY,
          client_secret: TIKTOK_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: TIKTOK_REDIRECT_URI,
        }).toString(),
      }
    );

    if (!tokenRes.ok) {
      const bodyText = await tokenRes.text();
      console.error(
        "[TikTok OAuth callback] Token exchange failed:",
        tokenRes.status,
        bodyText
      );
      return NextResponse.json(
        {
          error: "Failed exchanging code for tokens with TikTok",
          details: bodyText,
        },
        { status: 500 }
      );
    }

    tokenJson = (await tokenRes.json()) as TikTokTokenResponse;
  } catch (err: any) {
    console.error("[TikTok OAuth callback] Error during token exchange:", err);
    return NextResponse.json(
      {
        error: "Unexpected error during TikTok token exchange",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }

  const accessToken = tokenJson.access_token;
  const refreshToken = tokenJson.refresh_token;
  const externalUserId = tokenJson.open_id;

  if (!accessToken || !externalUserId) {
    console.error("[TikTok OAuth callback] Missing access_token or open_id", {
      tokenJson,
    });
    return NextResponse.json(
      {
        error: "TikTok token response did not include access_token/open_id",
      },
      { status: 500 }
    );
  }

  // --- 3) Fetch user profile info from TikTok ---
  let username: string | null = null;
  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  let profileData: any = null;

  try {
    const userInfoRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name,username",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userInfoRes.ok) {
      const text = await userInfoRes.text();
      console.warn(
        "[TikTok OAuth callback] user/info request failed:",
        userInfoRes.status,
        text
      );
    } else {
      const userInfoJson =
        (await userInfoRes.json()) as TikTokUserInfoResponse;
      const user = userInfoJson.data?.user;

      if (user) {
        profileData = user;
        username = user.username ?? null;
        displayName = user.display_name ?? null;
        avatarUrl = user.avatar_url ?? null;
      } else if (userInfoJson.error) {
        console.warn(
          "[TikTok OAuth callback] user/info error:",
          userInfoJson.error
        );
      }
    }
  } catch (err: any) {
    console.warn(
      "[TikTok OAuth callback] Error fetching TikTok user info:",
      err
    );
  }

  // --- 4) Upsert into connected_accounts in Supabase ---
  const supabase = createSupabaseServerClient();

  try {
    const { error: upsertError } = await supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: userId,
          platform: "tiktok",
          external_user_id: externalUserId,
          username,
          display_name: displayName,
          avatar_url: avatarUrl,
          profile_data: profileData ?? {},
          is_primary: true,
          last_refreshed_at: new Date().toISOString(),
          access_token: accessToken,
          refresh_token: refreshToken,
        },
        // NOTE: this assumes you have a UNIQUE INDEX on (user_id, platform)
        // If not, either add it or remove the onConflict option.
        { onConflict: "user_id,platform" }
      );

    if (upsertError) {
      console.error(
        "[TikTok OAuth callback] Failed saving TikTok account in Supabase:",
        upsertError
      );
      return NextResponse.json(
        {
          error: "Failed saving TikTok account in Supabase",
          details: upsertError.message,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error(
      "[TikTok OAuth callback] Unexpected error writing to Supabase:",
      err
    );
    return NextResponse.json(
      {
        error: "Failed saving TikTok account in Supabase",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }

  // --- 5) Redirect back into the app ---
  return NextResponse.redirect(new URL(returnTo, url.origin));
}
