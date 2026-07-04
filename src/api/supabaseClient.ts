import { createClient } from "@supabase/supabase-js";
import { appConfig } from "../config";

export function createBrowserSupabaseClient() {
  if (!appConfig.supabaseUrl || !appConfig.supabaseAnonKey) {
    throw new Error("Supabase URL and anon key are required for production mode.");
  }

  return createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce"
    }
  });
}

