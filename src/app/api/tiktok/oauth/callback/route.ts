// src/app/api/tiktok/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";

function getEnvOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      return NextResponse.json({ error: "Missing ?code" }, { status: 400 });
    }
    if (!state) {
      return NextResponse.json({ error: "Missing ?state" }, { status: 400 });
    }

    // Default return path
    let returnTo = "/accounts";
    try {
      const decoded = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8")
      );
      if (decoded?.r && typeof decoded.r === "string") {
        returnTo = decoded.r;
      }
    } catch (err) {
      console.warn("[tiktok/callback] Failed to decode state:", err);
    }

    const clientKey = getEnvOrThrow("TIKTOK_CLIENT_KEY");
    const clientSecret = getEnvOrThrow("TIKTOK_CLIENT_SECRET");
    const redirectUri = getEnvOrThrow("TIKTOK_REDIRECT_URI");

    // TikTok expects x-www-form-urlencoded
    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(TIKTOK_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const tokenJson: any = await tokenRes.json();
    console.log("[tiktok/callback] token response:", tokenJson);

    if (!tokenRes.ok) {
      console.error("[tiktok/callback] Token exchange failed:", tokenJson);
      return NextResponse.json(
        { error: "Failed to exchange token", details: tokenJson },
        { status: 500 }
      );
    }

    // Some envs nest under `data`, some don't
    const data = tokenJson.data ?? tokenJson;

    const accessToken: string | undefined = data.access_token;
    const refreshToken: string | undefined = data.refresh_token;
    const openId: string | undefined = data.open_id;
    const expiresIn: number | undefined = data.expires_in;

    if (!openId) {
      console.error("[tiktok/callback] Missing open_id:", data);
      return NextResponse.json(
        { error: "Missing open_id from TikTok response" },
        { status: 500 }
      );
    }

    if (!accessToken) {
      console.error("[tiktok/callback] Missing access_token:", data);
      return NextResponse.json(
        { error: "Missing access_token from TikTok response" },
        { status: 500 }
      );
    }

    // IMPORTANT: use cookie-aware route handler client, not service-role client
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      console.error("[tiktok/callback] getUser error:", userErr);
      return NextResponse.json(
        {
          error: "Failed to fetch current user",
          details: userErr.message ?? String(userErr),
        },
        { status: 500 }
      );
    }

    if (!user) {
      // Not logged in → send them to login
      return NextResponse.redirect(new URL("/login", url.origin));
    }

    const { data: upsertRows, error: upsertError } = await supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "tiktok",
          external_user_id: openId,
          access_token: accessToken,
          refresh_token: refreshToken ?? null,
          username: null,
          display_name: null,
          avatar_url: null,
          is_primary: true,
          last_refreshed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      )
      .select();

    if (upsertError) {
      console.error("[tiktok/callback] Supabase upsert error:", upsertError);
      return NextResponse.json(
        {
          error: "Failed saving TikTok account in Supabase",
          details: upsertError.message,
        },
        { status: 500 }
      );
    }

    console.log("[tiktok/callback] Upserted connected_accounts:", upsertRows);

    // Back to where they started
    return NextResponse.redirect(new URL(returnTo, url.origin));
  } catch (err: any) {
    console.error("[tiktok/callback] Unexpected error:", err);
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
