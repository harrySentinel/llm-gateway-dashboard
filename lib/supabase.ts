import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Clean whitespace — Vercel can embed \n in long values on copy-paste
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").replace(/\s/g, "");

  if (!url || !key) {
    throw new Error("Supabase env vars missing — check Vercel environment variables.");
  }

  if (!_client) {
    // createBrowserClient stores session in cookies, which the middleware can read
    _client = createBrowserClient(url, key);
  }
  return _client;
}
