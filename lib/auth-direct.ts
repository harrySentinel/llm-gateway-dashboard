"use client";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
// JWT tokens never contain whitespace — strip any embedded \r \n from copy-paste
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").replace(/\s/g, "");

interface AuthData {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: Record<string, unknown>;
}

async function authPost(endpoint: string, body: Record<string, string>): Promise<AuthData> {
  if (!SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in Vercel env vars.");
  }
  if (!SUPABASE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in Vercel env vars.");
  }

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
    throw new Error(
      `Request failed: ${e instanceof Error ? e.message : String(e)}` +
        ` (URL: ${endpoint}, key length: ${SUPABASE_KEY.length})`,
    );
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.error_description ??
        data.msg ??
        data.message ??
        data.error ??
        `HTTP ${res.status}`,
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
