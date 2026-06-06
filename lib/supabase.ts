import { createClient as _createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof _createClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      `Supabase env vars missing. URL="${url}" KEY="${key ? "set" : "missing"}"`,
    );
  }

  // Validate URL before handing to Supabase — surface bad values clearly
  try {
    new URL(url);
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${url}"`);
  }

  if (!_client) {
    _client = _createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}
