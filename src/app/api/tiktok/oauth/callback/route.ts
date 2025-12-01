// app/api/tiktok/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI!;

// Supabase admin client (server-only, NOT exposed to browser)
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

  // 1) Try treating state as a querystring: "uid=...&returnTo=/accounts"
  try {
    const sp = new URLSearchParams(rawState);
    const uidParam =
      sp.get("uid") || sp.get("user_id") || sp.get("u");
    if (uidParam) {
      userId = uidParam;
    }
    const rtParam = sp.get("returnTo") || sp.get("r");
    if (rtParam) {
      returnTo = rtParam;
    }
  } catch (e) {
    console.warn("Failed to parse state as URLSearchParams:", e);
  }

  // 2) If that didn't work, try base64-encoded JSON (TikTok Login Kit style)
  if (!userId) {
    try {
      const decoded = Buffer.from(rawState, "base64").toString("utf8");
      console.log("TIKTOK STATE DECODED:", decoded);

      const json = JSON.parse(decoded);
      userId =
        json.uid ||
        json.user_id ||
        json.u ||
        null;
      if (json.returnTo || json.r) {
        returnTo = json.returnTo || json.r;
      }
    } catch (e) {
      console.warn("Failed to decode state as base64 JSON:", e);
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

  // Handle error / cancel from TikTok
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
    // 1) Exchange code for access_token / refresh_token / open_id
    //
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
    console.log("TIKTOK TOKEN RAW:", JSON.stringify(tokenJson, null, 2));

    const tokenData = tokenJson.data ?? tokenJson;

    const access_token: string | undefined =
      tokenData.access_token ?? tokenData.accessToken;
    const refresh_token: string | undefined =
      tokenData.refresh_token ?? tokenData.refreshToken;
    const open_id: string | undefined =
      tokenData.open_id ?? tokenData.openId;

    if (!access_token || !refresh_token || !open_id) {
      console.error("Missing fields from TikTok token response:", tokenJson);
      return buildRedirect(req, "/accounts?error=missing_tiktok_token_fields");
    }

    //
    // 2) Fetch user info (display_name, username, avatar_url)
    //
    let display_name: string | null = null;
    let username: string | null = null;
    let avatar_url: string | null = null;

    try {
      const userInfoRes = await fetch(
        "https://open-api.tiktok.com/user/info/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            open_id,
            access_token,
            fields: ["display_name", "username", "avatar_url"],
          }),
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

        const dataRoot = userInfoJson.data ?? userInfoJson;

        // Possible shapes:
        // { data: { display_name, username, avatar_url } }
        // { data: { user: { ... } } }
        // { data: { user_info: { nickname, unique_id, avatar } } }
        // { data: { user_list: [ { ... } ] } }
        let userNode: any = dataRoot;

        if (dataRoot.user) {
          userNode = dataRoot.user;
        } else if (dataRoot.user_info) {
          userNode = dataRoot.user_info;
        } else if (Array.isArray(dataRoot.user_list) && dataRoot.user_list[0]) {
          userNode = dataRoot.user_list[0];
        }

        display_name =
          userNode.display_name ??
          userNode.nickname ??
          null;

        username =
          userNode.username ??
          userNode.unique_id ??
          null;

        avatar_url =
          userNode.avatar_url ??
          userNode.avatar ??
          userNode.avatar_medium ??
          null;
      }
    } catch (userInfoError) {
      console.error(
        "Unexpected error while fetching TikTok user info:",
        userInfoError
      );
    }

    //
    // 3) Upsert into connected_accounts
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
    // 4) Redirect back to Accounts (or state.returnTo)
    //
    return buildRedirect(req, `${returnTo}?connected=tiktok`);
  } catch (e) {
    console.error("Unexpected error in TikTok OAuth callback:", e);
    return buildRedirect(req, "/accounts?error=unexpected_tiktok_oauth_error");
  }
}

// If TikTok ever calls this endpoint with POST instead of GET
export { GET as POST };
