"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  username: string;
};

/**
 * On mount:
 *  - Detect the browser's IANA timezone (e.g. "America/Los_Angeles")
 *  - Upsert it into public.tiktok_account_timezones for the given username
 *
 * This keeps each creator's timezone in sync automatically as they move.
 */
export default function TimezoneInitializer({ username }: Props) {
  useEffect(() => {
    // If we somehow don’t have a username, bail
    if (!username) return;

    // Browser timezone, e.g. "America/Sao_Paulo"
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

    async function upsertTimezone() {
      try {
        const { error } = await supabase
          .from("tiktok_account_timezones")
          .upsert(
            {
              username,
              timezone,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "username",
            }
          );

        if (error) {
          console.error("Failed to upsert timezone:", error);
        } else {
          console.log(
            `Timezone upserted for ${username}: ${timezone}`
          );
        }
      } catch (err) {
        console.error("Unexpected error upserting timezone:", err);
      }
    }

    upsertTimezone();
  }, [username]);

  // No UI – this component just runs side effects
  return null;
}
