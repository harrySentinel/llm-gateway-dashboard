"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type LogItem, type LogsResponse, type GatewayKey } from "@/lib/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

function today()       { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
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
  return <div className={cn("animate-pulse rounded bg-muted", className)} />;
}

function StatusDot({ status }: { status: string }) {
  const ok = status === "success";
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn(
        "inline-block w-1.5 h-1.5 rounded-full shrink-0",
        ok ? "bg-emerald-500" : "bg-red-500",
      )} />
      <span className={cn("text-xs font-mono", ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
        {status}
      </span>
    </span>
  );
}

const selectCls = "rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const inputCls  = "rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      {[28, 36, 16, 20, 16, 16, 16, 16].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <Bone className={`h-3.5 w-${w}`} />
        </td>
      ))}
    </tr>
  );
}

// ── Log row ───────────────────────────────────────────────────────────────

function LogRow({ row }: { row: LogItem }) {
  return (
    <tr className="border-b border-border hover:bg-accent/30 transition-colors group">
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
        {fmtTs(row.timestamp)}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-foreground max-w-[180px] truncate">
        {row.model}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {row.provider}
          {row.fallback_used && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
              fallback
            </span>
          )}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground text-right whitespace-nowrap">
        <span className="text-foreground">{row.prompt_tokens.toLocaleString()}</span>
        <span className="text-muted-foreground/40 mx-1">/</span>
        <span className="text-foreground">{row.completion_tokens.toLocaleString()}</span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-right text-foreground whitespace-nowrap">
        {fmtCost(row.cost_usd)}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-right text-muted-foreground whitespace-nowrap">
        {fmtMs(row.latency_ms)}
      </td>
      <td className="px-4 py-3">
        <StatusDot status={row.status} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[120px]">
        {row.api_key_name ?? <span className="text-muted-foreground/40">—</span>}
      </td>
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
      from_date:  applied.from,
      to_date:    applied.to,
      provider:   applied.provider  || undefined,
      status:     applied.status    || undefined,
      api_key_id: applied.apiKeyId  ? Number(applied.apiKeyId) : undefined,
      page:       applied.page,
      page_size:  PAGE_SIZE,
    })
      .then((d) => { if (active) setData(d); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Failed"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applied]);

  useEffect(() => { return load(); }, [load]);

  const field = <K extends keyof Draft>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  const applyFilters = () => setApplied({ ...draft, page: 1 });
  const setPage      = (p: number) => setApplied((a) => ({ ...a, page: p }));

  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (applied.page - 1) * PAGE_SIZE + 1;
  const rangeEnd   = Math.min(applied.page * PAGE_SIZE, total);
  const hasFilters = applied.provider || applied.status || applied.apiKeyId;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Logs</h1>
          <p className="text-sm text-muted-foreground">All gateway requests, newest first</p>
        </div>
        {total > 0 && (
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
            {total.toLocaleString()} entries
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={draft.from} max={draft.to} onChange={field("from")} className={inputCls} />
        <span className="text-muted-foreground text-xs">—</span>
        <input type="date" value={draft.to} min={draft.from} max={today()} onChange={field("to")} className={inputCls} />

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
          {keys.map((k) => (
            <option key={k.id} value={String(k.id)}>{k.name}</option>
          ))}
        </select>

        <button
          onClick={applyFilters}
          disabled={loading}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Apply
        </button>

        {hasFilters && (
          <button
            onClick={() => { const r = { ...defaultDraft(), page: 1 }; setDraft(r); setApplied(r); }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {["Timestamp", "Model", "Provider", "Tokens ↑/↓", "Cost", "Latency", "Status", "Key"].map((h, i) => (
                  <th key={h} className={cn(
                    "px-4 py-3 text-[10px] uppercase tracking-widest font-medium text-muted-foreground whitespace-nowrap",
                    i >= 3 && i <= 5 ? "text-right" : "",
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {loading ? (
              <tbody>
                {Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} />)}
              </tbody>
            ) : data && data.items.length > 0 ? (
              <tbody>
                {data.items.map((row) => <LogRow key={row.id} row={row} />)}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No logs found for the selected filters.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">
          {total === 0
            ? "No results"
            : `${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${total.toLocaleString()}`}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(applied.page - 1)}
            disabled={applied.page <= 1 || loading}
            className="rounded-lg border border-border px-3 py-1.5 hover:bg-accent disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <span className="font-mono px-2 tabular-nums">
            {applied.page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(applied.page + 1)}
            disabled={applied.page >= totalPages || loading}
            className="rounded-lg border border-border px-3 py-1.5 hover:bg-accent disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
