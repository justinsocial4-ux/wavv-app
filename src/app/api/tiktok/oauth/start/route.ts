// src/app/api/tiktok/oauth/start/route.ts
import { NextRequest, NextResponse } from "next/server";

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export async function GET(req: NextRequest) {
  try {
    const clientKey = getEnvOrThrow("TIKTOK_CLIENT_KEY");
    const redirectUri = getEnvOrThrow("TIKTOK_REDIRECT_URI");

    // Optional: allow a return path, e.g. /accounts or /dashboard
    const url = new URL(req.url);
    const returnTo = url.searchParams.get("returnTo") ?? "/accounts";

    // Pack minimal state so we can safely redirect back after callback
    const statePayload = {
      r: returnTo,
      ts: Date.now(),
    };
    const state = Buffer.from(
      JSON.stringify(statePayload),
      "utf8"
    ).toString("base64url");

    const authUrl = new URL(TIKTOK_AUTH_URL);
    authUrl.searchParams.set("client_key", clientKey);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");

    // Keep scopes tight: only what we actually need now.
    // These are the defaults that come with Login Kit.
    authUrl.searchParams.set(
      "scope",
      "user.info.basic,user.info.profile,user.info.stats"
    );

    authUrl.searchParams.set("state", state);

    return NextResponse.redirect(authUrl.toString());
  } catch (err: any) {
    console.error("[tiktok/oauth/start] Error building auth URL:", err);

    return NextResponse.json(
      {
        error: "TikTok OAuth is not configured correctly.",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
