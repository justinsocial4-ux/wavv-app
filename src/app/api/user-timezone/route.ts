// src/app/api/user-timezone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * POST /api/user-timezone
 * Body: { timezone: string }
 *
 * For now we hard-code the TikTok username to "bigdealjfk" until
 * you have auth + per-user accounts wired up.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const timezone = body?.timezone as string | undefined;

    if (!timezone || typeof timezone !== "string") {
      return NextResponse.json(
        { error: "timezone is required" },
        { status: 400 }
      );
    }

    // TODO: replace this with the logged-in user's TikTok handle later
    const username = "bigdealjfk";

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("tiktok_account_timezones")
      .upsert(
        {
          username,
          timezone,
          // updated_at is optional if you have a default now() in the schema
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "username",
        }
      );

    if (error) {
      console.error("Error upserting timezone:", error);
      return NextResponse.json(
        { error: "Failed to save timezone" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in /api/user-timezone:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
