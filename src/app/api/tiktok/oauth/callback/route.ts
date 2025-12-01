// src/app/api/tiktok/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI!;

// Admin client – server only
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function buildRedirect(req: NextRequest, path: string) {
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(new URL(path, origin));
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const searchParams = url.searchParams;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle user cancel / error from TikTok
  if (error || !code) {
    return buildRedirect(
      req,
      `/accounts?error=${encodeURIComponent(error || "missing_code")}`
    );
  }

  // state should contain uid + returnTo
  if (!state) {
    return buildRedirect(req, "/accounts?error=missing_state");
  }

  const stateParams = new URLSearchParams(state);
  const userId = stateParams.get("uid");
  const returnTo = stateParams.get("returnTo") || "/accounts";

  if (!userId) {
    return buildRedirect(req, "/accounts?error=missing_user_id");
  }

  try {
    // 1) Exchange code for access_token / refresh_token / open_id
    const tokenRes = await fetch("https://open-api.tiktok.com/oauth/token/", {
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
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => "");
      console.error("TikTok token exchange failed:", tokenRes.status, body);
      return buildRedirect(req, "/accounts?error=tiktok_token_exchange_failed");
    }

    const tokenJson: any = await tokenRes.json();
    const tokenData = tokenJson.data ?? tokenJson;

    const access_token: string | undefined = tokenData.access_token;
    const refresh_token: string | undefined = tokenData.refresh_token;
    const open_id: string | undefined = tokenData.open_id;

    if (!access_token || !refresh_token || !open_id) {
      console.error("Missing fields from TikTok token response:", tokenJson);
      return buildRedirect(req, "/accounts?error=missing_tiktok_token_fields");
    }

    // 2) Fetch user info (display_name, username, avatar_url)
    // NOTE: If TikTok updates this API, you may need to adjust the URL or field names,
    // but we are using the exact endpoint you specified in your prompt.
    const userInfoRes = await fetch("https://open-api.tiktok.com/user/info/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        open_id,
        access_token,
        fields: ["display_name", "username", "avatar_url"],
      }),
    });

    if (!userInfoRes.ok) {
      const body = await userInfoRes.text().catch(() => "");
      console.error("TikTok user info fetch failed:", userInfoRes.status, body);

      // We still save tokens & open_id even if profile fetch fails
      const { error: upsertError } = await supabaseAdmin
        .from("connected_accounts")
        .upsert(
          {
            user_id: userId,
            platform: "tiktok",
            external_user_id: open_id,
            access_token,
            refresh_token,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,platform",
          }
        );

      if (upsertError) {
        console.error("Supabase upsert failed after user-info error:", upsertError);
        return buildRedirect(req, "/accounts?error=connected_account_upsert_failed");
      }

      return buildRedirect(req, `${returnTo}?warning=tiktok_user_info_failed`);
    }

    const userInfoJson: any = await userInfoRes.json();
    const userData = userInfoJson.data ?? userInfoJson;

    const display_name: string | null =
      userData.display_name ?? userData.nickname ?? null;
    const username: string | null =
      userData.username ?? userData.unique_id ?? null;
    const avatar_url: string | null =
      userData.avatar_url ?? userData.avatar ?? null;

    // 3) Upsert into connected_accounts
    const { error: upsertError } = await supabaseAdmin
      .from("connected_accounts")
      .upsert(
        {
          user_id: userId,
          platform: "tiktok",
          external_user_id: open_id,
          access_token,
          refresh_token,
          username,
          display_name,
          avatar_url,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      );

    if (upsertError) {
      console.error("Supabase upsert failed:", upsertError);
      return buildRedirect(req, "/accounts?error=connected_account_upsert_failed");
    }

    // 4) Redirect back to Accounts (or state returnTo)
    return buildRedirect(req, `${returnTo}?connected=tiktok`);
  } catch (e) {
    console.error("Unexpected error in TikTok OAuth callback:", e);
    return buildRedirect(req, "/accounts?error=unexpected_tiktok_oauth_error");
  }
}

// Optional: if TikTok ever calls this with POST instead of GET
export { GET as POST };
