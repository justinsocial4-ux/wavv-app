// app/api/tiktok/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI!;

// Supabase admin client (server-only)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function buildRedirect(req: NextRequest, path: string) {
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(new URL(path, origin));
}

function decodeState(rawState: string | null): {
  userId: string | null;
  returnTo: string;
} {
  let userId: string | null = null;
  let returnTo = "/accounts";

  if (!rawState) {
    return { userId, returnTo };
  }

  // Try raw querystring first
  try {
    const sp = new URLSearchParams(rawState);
    const uidParam = sp.get("uid") || sp.get("user_id") || sp.get("u");
    if (uidParam) userId = uidParam;

    const rtParam = sp.get("returnTo") || sp.get("r");
    if (rtParam) returnTo = rtParam;
  } catch {
    // ignore
  }

  // Fallback: base64 JSON (what TikTok Login Kit actually sends)
  if (!userId) {
    try {
      const decoded = Buffer.from(rawState, "base64").toString("utf8");
      console.log("TIKTOK STATE DECODED:", decoded);
      const json = JSON.parse(decoded);

      userId = json.uid || json.user_id || json.u || null;
      if (json.returnTo || json.r) {
        returnTo = json.returnTo || json.r;
      }
    } catch {
      // ignore
    }
  }

  return { userId, returnTo };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const searchParams = url.searchParams;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return buildRedirect(
      req,
      `/accounts?error=${encodeURIComponent(error || "missing_code")}`
    );
  }

  const { userId, returnTo } = decodeState(state);
  if (!userId) {
    return buildRedirect(req, "/accounts?error=missing_user_id");
  }

  try {
    //
    // 1) TikTok Token Exchange — v2 endpoint, exact x-www-form-urlencoded
    //
    const tokenBody =
      "client_key=" +
      encodeURIComponent(TIKTOK_CLIENT_KEY) +
      "&client_secret=" +
      encodeURIComponent(TIKTOK_CLIENT_SECRET) +
      "&code=" +
      encodeURIComponent(code) +
      "&grant_type=authorization_code" +
      "&redirect_uri=" +
      encodeURIComponent(TIKTOK_REDIRECT_URI);

    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        // TikTok is picky: only this exact value is accepted
        "content-type": "application/x-www-form-urlencoded",
      },
      body: tokenBody,
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => "");
      console.error("TikTok token exchange failed:", tokenRes.status, body);
      return buildRedirect(req, "/accounts?error=tiktok_token_exchange_failed");
    }

    const tokenJson: any = await tokenRes.json();
    console.log("TIKTOK TOKEN RAW:", JSON.stringify(tokenJson, null, 2));

    const tokenData = tokenJson.data ?? tokenJson;

    const access_token: string | undefined = tokenData.access_token;
    const refresh_token: string | undefined = tokenData.refresh_token;
    const open_id: string | undefined = tokenData.open_id;

    if (!access_token || !refresh_token || !open_id) {
      console.error("Missing fields from TikTok token response:", tokenJson);
      return buildRedirect(req, "/accounts?error=missing_tiktok_token_fields");
    }

    //
    // 2) Fetch TikTok User Info — v2 Display API
    //    GET https://open.tiktokapis.com/v2/user/info/?fields=...
    //
    let display_name: string | null = null;
    let username: string | null = null;
    let avatar_url: string | null = null;

    try {
      const fields = [
        "open_id",
        "display_name",
        "username",
        "avatar_url",
        "avatar_url_100",
        "avatar_large_url",
        "bio_description",
        "profile_deep_link",
      ].join(",");

      const userInfoRes = await fetch(
        `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(
          fields
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (!userInfoRes.ok) {
        const body = await userInfoRes.text().catch(() => "");
        console.error(
          "TikTok user info fetch failed:",
          userInfoRes.status,
          body
        );
      } else {
        const userInfoJson: any = await userInfoRes.json();
        console.log(
          "TIKTOK USER INFO RAW:",
          JSON.stringify(userInfoJson, null, 2)
        );

        const dataRoot = userInfoJson.data ?? {};
        // per docs: { data: { user: { ... } } }
        const userNode: any = dataRoot.user ?? dataRoot;

        display_name = userNode.display_name ?? null;
        username = userNode.username ?? null;
        avatar_url =
          userNode.avatar_url ??
          userNode.avatar_large_url ??
          userNode.avatar_url_100 ??
          null;
      }
    } catch (userInfoError) {
      console.error(
        "Unexpected TikTok user info error:",
        userInfoError
      );
    }

    //
    // 3) Upsert connected account
    //
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
      return buildRedirect(
        req,
        "/accounts?error=connected_account_upsert_failed"
      );
    }

    //
    // 4) Redirect back to accounts
    //
    return buildRedirect(req, `${returnTo}?connected=tiktok`);
  } catch (e) {
    console.error("Unexpected error in TikTok OAuth callback:", e);
    return buildRedirect(req, "/accounts?error=unexpected_tiktok_oauth_error");
  }
}

// Fallback if TikTok ever calls POST
export { GET as POST };