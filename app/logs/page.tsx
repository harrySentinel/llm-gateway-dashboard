"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type LogItem, type LogsResponse, type GatewayKey } from "@/lib/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

function today()         { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const fmtCost = (v: number) => `$${v.toFixed(4)}`;
const fmtMs   = (v: number) => `${Math.round(v).toLocaleString()}ms`;
const fmtTs   = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

// ── Primitives ────────────────────────────────────────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800", className)} />;
}

function StatusDot({ status }: { status: string }) {
  const ok = status === "success";
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", ok ? "bg-emerald-500" : "bg-red-500")} />
      <span className={cn("text-xs font-mono", ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
        {status}
      </span>
    </span>
  );
}

const selectCls = "rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 w-full sm:w-auto";
const inputCls  = "rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 w-full sm:w-auto";

// ── Mobile log card ───────────────────────────────────────────────────────

function LogCard({ row }: { row: LogItem }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-medium text-zinc-900 dark:text-white truncate max-w-[200px]">
            {row.model}
          </p>
          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{fmtTs(row.timestamp)}</p>
        </div>
        <StatusDot status={row.status} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Provider</span>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {row.provider}
            {row.fallback_used && (
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">fallback</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Tokens</span>
          <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
            {row.prompt_tokens.toLocaleString()}/{row.completion_tokens.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Cost</span>
          <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{fmtCost(row.cost_usd)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Latency</span>
          <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{fmtMs(row.latency_ms)}</span>
        </div>
      </div>

      {row.api_key_name && (
        <p className="text-[10px] text-zinc-400 truncate">Key: {row.api_key_name}</p>
      )}
    </div>
  );
}

// ── Desktop table row ─────────────────────────────────────────────────────

function LogRow({ row }: { row: LogItem }) {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-zinc-400 whitespace-nowrap">{fmtTs(row.timestamp)}</td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 max-w-[160px] truncate">{row.model}</td>
      <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          {row.provider}
          {row.fallback_used && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">fallback</span>
          )}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-right text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        <span className="text-zinc-800 dark:text-zinc-200">{row.prompt_tokens.toLocaleString()}</span>
        <span className="text-zinc-300 dark:text-zinc-600 mx-1">/</span>
        <span className="text-zinc-800 dark:text-zinc-200">{row.completion_tokens.toLocaleString()}</span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-right text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{fmtCost(row.cost_usd)}</td>
      <td className="px-4 py-3 font-mono text-xs text-right text-zinc-400 whitespace-nowrap">{fmtMs(row.latency_ms)}</td>
      <td className="px-4 py-3"><StatusDot status={row.status} /></td>
      <td className="px-4 py-3 text-xs text-zinc-400 truncate max-w-[100px]">{row.api_key_name ?? <span className="opacity-40">—</span>}</td>
    </tr>
  );
}

// ── Filter state ──────────────────────────────────────────────────────────

type Draft   = { from: string; to: string; provider: string; status: string; apiKeyId: string };
type Applied = Draft & { page: number };

function defaultDraft(): Draft {
  return { from: daysAgo(30), to: today(), provider: "", status: "", apiKeyId: "" };
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [draft,   setDraft  ] = useState<Draft>(defaultDraft);
  const [applied, setApplied] = useState<Applied>({ ...defaultDraft(), page: 1 });
  const [data,    setData   ] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState<string | null>(null);
  const [keys,    setKeys   ] = useState<GatewayKey[]>([]);

  useEffect(() => { api.keys.list().then(setKeys).catch(() => {}); }, []);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.logs({
      from_date: applied.from, to_date: applied.to,
      provider:  applied.provider  || undefined,
      status:    applied.status    || undefined,
      api_key_id: applied.apiKeyId ? Number(applied.apiKeyId) : undefined,
      page: applied.page, page_size: PAGE_SIZE,
    })
      .then(d => { if (active) setData(d); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Failed"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applied]);

  useEffect(() => load(), [load]);

  const field = <K extends keyof Draft>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft(d => ({ ...d, [key]: e.target.value }));

  const applyFilters = () => setApplied({ ...draft, page: 1 });
  const setPage      = (p: number) => setApplied(a => ({ ...a, page: p }));

  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (applied.page - 1) * PAGE_SIZE + 1;
  const rangeEnd   = Math.min(applied.page * PAGE_SIZE, total);
  const hasFilters = applied.provider || applied.status || applied.apiKeyId;

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Logs</h1>
          <p className="text-sm text-zinc-400 mt-0.5">All gateway requests, newest first</p>
        </div>
        {total > 0 && (
          <span className="text-xs font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
            {total.toLocaleString()} entries
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <input type="date" value={draft.from} max={draft.to} onChange={field("from")} className={inputCls} />
            <span className="text-zinc-300 dark:text-zinc-600 text-xs hidden sm:block">—</span>
            <input type="date" value={draft.to} min={draft.from} max={today()} onChange={field("to")} className={inputCls} />
          </div>

          <select value={draft.provider} onChange={field("provider")} className={selectCls}>
            <option value="">All providers</option>
            <option value="groq">Groq</option>
            <option value="gemini">Gemini</option>
          </select>

          <select value={draft.status} onChange={field("status")} className={selectCls}>
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>

          <select value={draft.apiKeyId} onChange={field("apiKeyId")} className={selectCls}>
            <option value="">All keys</option>
            {keys.map(k => <option key={k.id} value={String(k.id)}>{k.name}</option>)}
          </select>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="flex-1 sm:flex-none rounded-xl bg-zinc-900 dark:bg-white px-4 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              Apply
            </button>
            {hasFilters && (
              <button
                onClick={() => { const r = { ...defaultDraft(), page: 1 }; setDraft(r); setApplied(r); }}
                className="flex-1 sm:flex-none rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Mobile: card list */}
      <div className="sm:hidden space-y-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <Bone key={i} className="h-32" />)
          : data?.items.length
          ? data.items.map(row => <LogCard key={row.id} row={row} />)
          : !loading && (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 py-12 text-center text-sm text-zinc-400">
              No logs for the selected filters.
            </div>
          )}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70">
              <tr>
                {["Timestamp", "Model", "Provider", "Tokens ↑/↓", "Cost", "Latency", "Status", "Key"].map((h, i) => (
                  <th key={h} className={cn(
                    "px-4 py-3 text-[10px] uppercase tracking-widest font-medium text-zinc-400 whitespace-nowrap",
                    i >= 3 && i <= 5 ? "text-right" : "",
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            {loading ? (
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Bone className="h-3.5 w-full max-w-[80px]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : data?.items.length ? (
              <tbody>
                {data.items.map(row => <LogRow key={row.id} row={row} />)}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-zinc-400">
                    No logs for the selected filters.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="font-mono">
          {total === 0 ? "No results" : `${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${total.toLocaleString()}`}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(applied.page - 1)}
            disabled={applied.page <= 1 || loading}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors text-zinc-600 dark:text-zinc-400"
          >
            ← Prev
          </button>
          <span className="font-mono px-2 tabular-nums text-zinc-500">
            {applied.page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(applied.page + 1)}
            disabled={applied.page >= totalPages || loading}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors text-zinc-600 dark:text-zinc-400"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
