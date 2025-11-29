// src/app/api/tiktok/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      return NextResponse.json({ error: "Missing ?code" }, { status: 400 });
    }
    if (!state) {
      return NextResponse.json({ error: "Missing ?state" }, { status: 400 });
    }

    // Default to /accounts if we can't decode state
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

    // 1) Exchange code for access token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("[tiktok/callback] Token exchange failed:", tokenJson);
      return NextResponse.json(
        { error: "Failed to exchange token", details: tokenJson },
        { status: 500 }
      );
    }

    // TikTok v2 OAuth response shape (simplified)
    const {
      access_token,
      refresh_token,
      open_id,
      expires_in,
    }: {
      access_token?: string;
      refresh_token?: string;
      open_id?: string;
      expires_in?: number;
    } = tokenJson;

    if (!open_id) {
      console.error("[tiktok/callback] Missing open_id in token response:", tokenJson);
      return NextResponse.json(
        { error: "Missing open_id from TikTok response" },
        { status: 500 }
      );
    }

    // 2) Get current Supabase user (must be logged in)
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[tiktok/callback] No authenticated user:", userError);
      // NOTE: use absolute URL for redirects from route handlers
      return NextResponse.redirect(new URL("/login", url.origin));
    }

    // 3) Upsert connected_accounts row
    // IMPORTANT: only use columns that actually exist on the table.
    // We'll stash tokens inside profile_data JSON for now.
    const { data: upsertRows, error: upsertError } = await supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "tiktok",
          external_user_id: open_id,
          // keep creator_profile_id null for now; we can wire it later
          profile_data: {
            access_token,
            refresh_token,
            expires_in,
            last_token_received_at: new Date().toISOString(),
          },
          is_primary: true,
        },
        {
          // We want one TikTok connection per user for now
          onConflict: "user_id,platform",
        }
      )
      .select("*");

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

    // 4) Redirect back to where they started (e.g. /accounts)
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
