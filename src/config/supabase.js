import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Server-side client (service role): full DB access, bypasses RLS.
// Never expose this key to the browser.
export const supabase = createClient(env.supabase.url, env.supabase.serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
