"use client";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

interface AuthData {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: Record<string, unknown>;
}

async function authPost(endpoint: string, body: Record<string, string>): Promise<AuthData> {
  // Surface exactly what values we have so the user can diagnose
  if (!SUPABASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is empty. " +
      "Go to Vercel → Settings → Environment Variables, add it, then Redeploy.",
    );
  }
  if (!SUPABASE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is empty. " +
      "Go to Vercel → Settings → Environment Variables, add it, then Redeploy.",
    );
  }

  // Wrap fetch so we always get a readable error instead of the browser's generic one
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // Show the actual URL so we can see what's broken
    throw new Error(
      `Network error calling "${endpoint}": ${e instanceof Error ? e.message : String(e)}. ` +
      `SUPABASE_URL="${SUPABASE_URL.slice(0, 50)}"`,
    );
  }

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
  return authPost(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { email, password });
}
