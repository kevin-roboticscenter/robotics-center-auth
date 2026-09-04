import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv, portalCookieOptions } from "./config";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createBrowserSupabaseClient() {
  if (client) return client;
  const { url, anonKey } = getSupabaseEnv();
  client = createBrowserClient(url, anonKey, {
    cookieOptions: portalCookieOptions,
  });
  return client;
}
