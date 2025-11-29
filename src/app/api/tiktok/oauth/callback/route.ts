// src/app/api/tiktok/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

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

    // Decode state payload (original returnTo route)
    let returnTo = "/accounts";
    try {
      const decoded = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8")
      );
      if (decoded?.r) returnTo = decoded.r;
    } catch (err) {
      console.warn("State decode failed:", err);
    }

    const clientKey = getEnvOrThrow("TIKTOK_CLIENT_KEY");
    const clientSecret = getEnvOrThrow("TIKTOK_CLIENT_SECRET");
    const redirectUri = getEnvOrThrow("TIKTOK_REDIRECT_URI");

    // Exchange the auth code for access token
    const tokenRes = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_key: clientKey,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("TikTok token error:", tokenJson);
      return NextResponse.json(
        { error: "Failed to exchange token", details: tokenJson },
        { status: 500 }
      );
    }

    const {
      access_token,
      refresh_token,
      open_id, // TikTok user ID
      expires_in,
    } = tokenJson;

    // Ensure user is authenticated in Supabase
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect("/login");
    }

    // Insert or update connected_accounts
    const { error: upsertError } = await supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "tiktok",
          external_user_id: open_id,
          access_token,
          refresh_token,
          username: null, // we'll fill this after pulling profile
          display_name: null,
          is_primary: true,
        },
        {
          onConflict: "user_id,platform",
        }
      );

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed saving TikTok account" },
        { status: 500 }
      );
    }

    // Redirect them to your accounts page (or wherever they started)
    return NextResponse.redirect(returnTo);
  } catch (err: any) {
    console.error("Callback error:", err);
    return NextResponse.json(
      { error: "Unexpected error", details: err?.message },
      { status: 500 }
    );
  }
}
