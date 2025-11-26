// src/lib/supabaseServerClient.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in .env.local");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
}

// Narrow the types so TS knows these are plain strings, not string | undefined
const supabaseUrl: string = SUPABASE_URL;
const supabaseServiceRoleKey: string = SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseServerClient(): SupabaseClient {
  // This returns a SupabaseClient directly (not a Promise), which is what we want
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
