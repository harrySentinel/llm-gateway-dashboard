/**
 * Gateway API client.
 *
 * Reads two NEXT_PUBLIC_ env vars so the values are available in both
 * Server Components and Client Components (Next.js exposes NEXT_PUBLIC_
 * vars at build time for the browser bundle):
 *
 *   NEXT_PUBLIC_API_URL      — FastAPI base URL, e.g. http://localhost:8000
 *   NEXT_PUBLIC_GATEWAY_KEY  — Bearer token for Authorization header
 *
 * Security note: NEXT_PUBLIC_ vars are embedded in the browser bundle and
 * visible to anyone who inspects the page source. For a private dashboard
 * used only by you this is acceptable. For a multi-tenant product, proxy
 * calls through Next.js Route Handlers and keep the key server-side only.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const KEY = process.env.NEXT_PUBLIC_GATEWAY_KEY ?? "";

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
  date: string;           // "YYYY-MM-DD"
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
  /** Called for every text delta that arrives. */
  onToken(token: string): void;
  /** Called once after the stream closes cleanly. `usage` is null for providers
   *  that don't embed usage in SSE chunks (e.g. Gemini via our backend). */
  onComplete(usage: StreamUsage | null): void;
  /** Called on any non-abort network or HTTP error. */
  onError(err: Error): void;
  /** Pass an AbortSignal to support cancellation. */
  signal?: AbortSignal;
}

/**
 * POST /v1/chat with stream:true.
 *
 * Uses the Fetch API + ReadableStream — NOT EventSource, which is GET-only.
 *
 * SSE parsing strategy:
 *   - Accumulate raw bytes in a string buffer via TextDecoder({ stream: true })
 *     so multi-byte UTF-8 chars that span chunk boundaries are handled correctly.
 *   - Split on "\n"; keep the last (potentially incomplete) line in the buffer.
 *   - Each "data: " line is a self-contained JSON object (OpenAI chunk format).
 *
 * Abort behaviour:
 *   - AbortError is silently swallowed — the caller decides what to render.
 *   - All callbacks are no-ops after the signal fires; callers can also guard
 *     with `if (signal.aborted) return` inside their own callbacks.
 */
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
        ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}),
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

      // { stream: true } = don't flush the internal state between calls
      buffer += decoder.decode(value, { stream: true });

      // Split on newline; keep the last (possibly incomplete) line for next round
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
          // Groq sends usage in the last chunk; Gemini does not
          if (chunk.usage) usage = chunk.usage as StreamUsage;
        } catch {
          // Ignore malformed chunks — partial JSON is not expected but handled
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

// ── Core fetch wrapper ────────────────────────────────────────────────────

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}),
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
function qs(params: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ── Typed API surface ─────────────────────────────────────────────────────

export const api = {
  /** GET /v1/stats — aggregated cost, latency, requests over a date range. */
  stats(params?: { from_date?: string; to_date?: string }) {
    return request<StatsResponse>(`/v1/stats${qs(params ?? {})}`);
  },

  /** GET /v1/stats/daily — one row per calendar day for time-series charts. */
  daily(params?: { from_date?: string; to_date?: string }) {
    return request<DailyStat[]>(`/v1/stats/daily${qs(params ?? {})}`);
  },

  /** GET /v1/logs — paginated request logs with optional filters. */
  logs(params?: {
    from_date?: string;
    to_date?: string;
    provider?: string;
    status?: string;
    api_key_id?: number;
    page?: number;
    page_size?: number;
  }) {
    return request<LogsResponse>(`/v1/logs${qs(params ?? {})}`);
  },

  keys: {
    /** GET /v1/keys */
    list: () => request<GatewayKey[]>("/v1/keys"),

    /** POST /v1/keys — returns the plaintext key once. */
    create: (name: string) =>
      request<CreateKeyResponse>("/v1/keys", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
  },

  /** POST /v1/chat — non-streaming inference call. */
  chat(body: { model: string; messages: Message[] }) {
    return request<ChatResponse>("/v1/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
