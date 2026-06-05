"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type LogItem, type LogsResponse, type GatewayKey } from "@/lib/api";

// ── Constants ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

// ── Date helpers ──────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── Formatters ────────────────────────────────────────────────────────────

const fmtCost = (v: number) => `$${v.toFixed(4)}`;
const fmtMs   = (v: number) => `${Math.round(v).toLocaleString()} ms`;
const fmtTs   = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month:   "short",
    day:     "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
    second:  "2-digit",
    hour12:  false,
  });

// ── Skeleton primitive (same pattern as Overview) ─────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />;
}

// ── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const ok = status === "success";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

// ── Error banner (same pattern as Overview) ───────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {message}
    </div>
  );
}

// ── Table skeletons ───────────────────────────────────────────────────────

const COL_COUNT = 8; // timestamp model provider tokens cost latency status fallback

function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: COL_COUNT }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <Bone className={`h-4 ${i === 0 ? "w-28" : i === 1 ? "w-32" : "w-16"}`} />
        </td>
      ))}
    </tr>
  );
}

function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 12 }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </tbody>
  );
}

// ── Log table row ─────────────────────────────────────────────────────────

function LogRow({ row }: { row: LogItem }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Timestamp */}
      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500">
        {fmtTs(row.timestamp)}
      </td>

      {/* Model */}
      <td className="px-3 py-3 font-mono text-xs text-gray-800">
        {row.model}
      </td>

      {/* Provider + fallback indicator */}
      <td className="px-3 py-3 text-sm">
        {row.provider}
        {row.fallback_used && (
          <span className="ml-1.5 text-xs text-orange-500" title="Served by fallback provider">
            (fallback)
          </span>
        )}
      </td>

      {/* Tokens in / out */}
      <td className="px-3 py-3 text-right tabular-nums text-sm">
        <span className="text-gray-400 text-xs">↑</span>
        {row.prompt_tokens.toLocaleString()}
        {" / "}
        <span className="text-gray-400 text-xs">↓</span>
        {row.completion_tokens.toLocaleString()}
      </td>

      {/* Cost */}
      <td className="px-3 py-3 text-right tabular-nums text-sm">
        {fmtCost(row.cost_usd)}
      </td>

      {/* Latency */}
      <td className="px-3 py-3 text-right tabular-nums text-sm">
        {fmtMs(row.latency_ms)}
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <StatusBadge status={row.status} />
      </td>

      {/* API key */}
      <td className="px-3 py-3 text-xs text-gray-500">
        {row.api_key_name ?? "—"}
      </td>
    </tr>
  );
}

// ── Filter state ──────────────────────────────────────────────────────────

type Draft = {
  from:      string;
  to:        string;
  provider:  string;
  status:    string;
  apiKeyId:  string; // "" or numeric string
};

type Applied = Draft & { page: number };

function defaultDraft(): Draft {
  return { from: daysAgo(30), to: today(), provider: "", status: "", apiKeyId: "" };
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [draft, setDraft]     = useState<Draft>(defaultDraft);
  const [applied, setApplied] = useState<Applied>({ ...defaultDraft(), page: 1 });

  const [data, setData]       = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // API keys — loaded once for the filter dropdown, silent failure on error
  const [keys, setKeys]       = useState<GatewayKey[]>([]);
  useEffect(() => {
    api.keys.list().then(setKeys).catch(() => {});
  }, []);

  // ── Fetch — same cancellation-flag pattern as Overview ───────────────────
  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api
      .logs({
        from_date:  applied.from,
        to_date:    applied.to,
        provider:   applied.provider  || undefined,
        status:     applied.status    || undefined,
        api_key_id: applied.apiKeyId  ? Number(applied.apiKeyId) : undefined,
        page:       applied.page,
        page_size:  PAGE_SIZE,
      })
      .then((d) => { if (active) setData(d); })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Failed to load logs");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [applied]);

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load]);

  // ── Filter handlers ───────────────────────────────────────────────────────
  const applyFilters = () => setApplied({ ...draft, page: 1 });
  const setPage = (p: number) => setApplied((a) => ({ ...a, page: p }));

  const field = <K extends keyof Draft>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  // ── Pagination math ───────────────────────────────────────────────────────
  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (applied.page - 1) * PAGE_SIZE + 1;
  const rangeEnd   = Math.min(applied.page * PAGE_SIZE, total);

  // ── Select classes (identical so easy to restyle later) ───────────────────
  const selectCls =
    "rounded border border-gray-200 bg-white px-2 py-1 text-sm";
  const inputCls =
    "rounded border border-gray-200 px-2 py-1 text-sm";

  return (
    <div className="space-y-5 max-w-7xl">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold">Logs</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          All gateway requests, newest first
        </p>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-2">

        {/* Date range */}
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          From
          <input type="date" value={draft.from} max={draft.to}
            onChange={field("from")} className={inputCls} />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          To
          <input type="date" value={draft.to} min={draft.from} max={today()}
            onChange={field("to")} className={inputCls} />
        </label>

        {/* Provider */}
        <select value={draft.provider} onChange={field("provider")} className={selectCls}>
          <option value="">All providers</option>
          <option value="groq">Groq</option>
          <option value="gemini">Gemini</option>
        </select>

        {/* Status */}
        <select value={draft.status} onChange={field("status")} className={selectCls}>
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>

        {/* API key — populated from the keys endpoint */}
        <select value={draft.apiKeyId} onChange={field("apiKeyId")} className={selectCls}>
          <option value="">All keys</option>
          {keys.map((k) => (
            <option key={k.id} value={String(k.id)}>
              {k.name}
            </option>
          ))}
        </select>

        <button
          onClick={applyFilters}
          disabled={loading}
          className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          Apply
        </button>

        {/* Active filter summary — helpful when filters are set */}
        {(applied.provider || applied.status || applied.apiKeyId) && (
          <button
            onClick={() => {
              const reset = { ...defaultDraft(), page: 1 };
              setDraft(reset);
              setApplied(reset);
            }}
            className="text-xs text-gray-400 underline hover:text-gray-600"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && <ErrorBanner message={error} />}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-3">Timestamp</th>
              <th className="px-3 py-3">Model</th>
              <th className="px-3 py-3">Provider</th>
              <th className="px-3 py-3 text-right">Tokens ↑/↓</th>
              <th className="px-3 py-3 text-right">Cost</th>
              <th className="px-3 py-3 text-right">Latency</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">API Key</th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton />
          ) : data && data.items.length > 0 ? (
            <tbody>
              {data.items.map((row) => (
                <LogRow key={row.id} row={row} />
              ))}
            </tbody>
          ) : (
            <tbody>
              <tr>
                <td
                  colSpan={COL_COUNT}
                  className="px-3 py-12 text-center text-sm text-gray-400"
                >
                  No logs found for this date range and filters.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        {/* Count summary */}
        <span>
          {total === 0
            ? "No results"
            : `Showing ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${total.toLocaleString()}`}
        </span>

        {/* Prev / page info / Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(applied.page - 1)}
            disabled={applied.page <= 1 || loading}
            className="rounded border border-gray-200 px-3 py-1 text-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="tabular-nums">
            {applied.page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(applied.page + 1)}
            disabled={applied.page >= totalPages || loading}
            className="rounded border border-gray-200 px-3 py-1 text-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
