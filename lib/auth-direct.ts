/**
 * Direct REST API calls to Supabase auth endpoints.
 * Bypasses @supabase/auth-js entirely — that library has an internal
 * fetch issue in this deployment environment.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

interface AuthData {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: Record<string, unknown>;
}

async function authPost(endpoint: string, body: Record<string, string>): Promise<AuthData> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel.");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.error_description ?? data.msg ?? data.message ?? data.error ?? "Authentication failed",
    );
  }
  return data;
}

export async function signUpDirect(email: string, password: string): Promise<AuthData> {
  return authPost(`${SUPABASE_URL}/auth/v1/signup`, { email, password });
}

export async function signInDirect(email: string, password: string): Promise<AuthData> {
  return authPost(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    { email, password },
  );
}
