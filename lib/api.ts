import { createClient } from "@/lib/supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// Used only for /v1/chat — gateway keys issued via POST /v1/keys
const GW_KEY = process.env.NEXT_PUBLIC_GATEWAY_KEY ?? "";

// ── Shared types matching FastAPI response shapes ─────────────────────────

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Totals {
  requests: number;
  cost_usd: number;
  avg_latency_ms: number;
  success_rate: number; // 0–1
}

export interface ProviderStat {
  provider: string;
  requests: number;
  cost_usd: number;
  avg_latency_ms: number;
  success_rate: number;
}

export interface ApiKeyStat {
  api_key_id: number | null;
  api_key_name: string | null;
  requests: number;
  cost_usd: number;
  avg_latency_ms: number;
}

export interface StatsResponse {
  period: { from: string; to: string };
  totals: Totals;
  by_provider: ProviderStat[];
  by_api_key: ApiKeyStat[];
}

export interface LogItem {
  id: number;
  timestamp: string;
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  latency_ms: number;
  status: string;
  api_key_id: number | null;
  api_key_name: string | null;
  fallback_used: boolean;
}

export interface LogsResponse {
  total: number;
  page: number;
  page_size: number;
  items: LogItem[];
}

export interface GatewayKey {
  id: number;
  name: string;
  created_at: string;
  is_active: boolean;
}

export interface CreateKeyResponse extends GatewayKey {
  key: string; // plaintext — shown once by the backend, never retrievable again
}

export interface DailyStat {
  date: string; // "YYYY-MM-DD"
  requests: number;
  cost_usd: number;
  avg_latency_ms: number;
}

export interface ChatChoice {
  index: number;
  message: Message;
  finish_reason: string;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// ── Streaming types ───────────────────────────────────────────────────────

export interface StreamUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface StreamCallbacks {
  onToken(token: string): void;
  onComplete(usage: StreamUsage | null): void;
  onError(err: Error): void;
  signal?: AbortSignal;
}

// ── Auth helpers ──────────────────────────────────────────────────────────

async function getSupabaseToken(): Promise<string> {
  try {
    const supabase = createClient();
    // Race against a 6s timeout — prevents infinite skeleton on cold Fly.io starts
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Auth timeout — please refresh")), 6000),
      ),
    ]);
    const { data: { session } } = result;
    if (session?.access_token) return session.access_token;
  } catch (e) {
    throw e instanceof Error ? e : new Error("Not authenticated");
  }
  throw new Error("Session expired — please sign in again");
}

// ── Dashboard API calls (Supabase JWT) ────────────────────────────────────

async function dashboardRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getSupabaseToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Chat API calls (gateway gw_ key) ─────────────────────────────────────

async function chatRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(GW_KEY ? { Authorization: `Bearer ${GW_KEY}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

/** Build a query string, omitting undefined values. */
function qs(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ── Streaming (uses gw_ key for /v1/chat) ────────────────────────────────

export async function streamChat(
  body: { model: string; messages: Message[] },
  { onToken, onComplete, onError, signal }: StreamCallbacks,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GW_KEY ? { Authorization: `Bearer ${GW_KEY}` } : {}),
      },
      body: JSON.stringify({ ...body, stream: true }),
      signal,
    });
  } catch (e) {
    if ((e as DOMException).name !== "AbortError") onError(e as Error);
    return;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    onError(new Error(`${res.status}: ${text}`));
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let usage: StreamUsage | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;

        try {
          const chunk = JSON.parse(payload);
          const delta: string | undefined = chunk.choices?.[0]?.delta?.content;
          if (delta) onToken(delta);
          if (chunk.usage) usage = chunk.usage as StreamUsage;
        } catch {
          // ignore malformed chunks
        }
      }
    }
  } catch (e) {
    if ((e as DOMException).name !== "AbortError") onError(e as Error);
    return;
  } finally {
    reader.releaseLock();
  }

  onComplete(usage);
}

// ── Typed API surface ─────────────────────────────────────────────────────

export const api = {
  stats(params?: { from_date?: string; to_date?: string }) {
    return dashboardRequest<StatsResponse>(`/v1/stats${qs(params ?? {})}`);
  },

  daily(params?: { from_date?: string; to_date?: string }) {
    return dashboardRequest<DailyStat[]>(`/v1/stats/daily${qs(params ?? {})}`);
  },

  logs(params?: {
    from_date?: string;
    to_date?: string;
    provider?: string;
    status?: string;
    api_key_id?: number;
    page?: number;
    page_size?: number;
  }) {
    return dashboardRequest<LogsResponse>(`/v1/logs${qs(params ?? {})}`);
  },

  keys: {
    list: () => dashboardRequest<GatewayKey[]>("/v1/keys"),
    create: (name: string) =>
      dashboardRequest<CreateKeyResponse>("/v1/keys", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
  },

  chat(body: { model: string; messages: Message[] }) {
    return chatRequest<ChatResponse>("/v1/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
