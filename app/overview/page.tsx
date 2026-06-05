"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { api, type StatsResponse, type DailyStat } from "@/lib/api";

// ── Dynamic import — recharts touches ResizeObserver/window, must be client-only
const ChartsSection = dynamic(() => import("./charts"), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
});

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

const fmtNum  = (v: number) => v.toLocaleString();
const fmtCost = (v: number) => `$${v.toFixed(4)}`;
const fmtMs   = (v: number) => `${Math.round(v).toLocaleString()} ms`;
const fmtPct  = (v: number) => `${(v * 100).toFixed(1)}%`;

// ── Skeleton primitives ───────────────────────────────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-2">
      <Bone className="h-3 w-20" />
      <Bone className="h-7 w-28" />
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="space-y-4">
      <Bone className="h-[248px] w-full rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Bone className="h-[248px] rounded-lg" />
        <Bone className="h-[248px] rounded-lg" />
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Data shape fetched together ───────────────────────────────────────────

type PageData = {
  stats: StatsResponse;
  daily: DailyStat[];
};

// ── Page ──────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  // Two-level date state: draft (what the inputs show) vs applied (what's fetched)
  const [draft, setDraft] = useState({ from: daysAgo(30), to: today() });
  const [applied, setApplied] = useState(draft);

  const [data, setData]       = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.stats({ from_date: applied.from, to_date: applied.to }),
      api.daily({ from_date: applied.from, to_date: applied.to }),
    ])
      .then(([stats, daily]) => {
        if (active) setData({ stats, daily });
      })
      .catch((e: unknown) => {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applied]);

  // Re-fetch whenever the applied date range changes
  useEffect(() => {
    const cancel = fetch();
    return cancel;
  }, [fetch]);

  const applyFilter = () => setApplied(draft);

  const { totals } = data?.stats ?? {};

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Gateway usage and cost summary
          </p>
        </div>

        {/* ── Date-range filter ──────────────────────────────────────── */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            From
            <input
              type="date"
              value={draft.from}
              max={draft.to}
              onChange={(e) =>
                setDraft((d) => ({ ...d, from: e.target.value }))
              }
              className="rounded border border-gray-200 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            To
            <input
              type="date"
              value={draft.to}
              min={draft.from}
              max={today()}
              onChange={(e) =>
                setDraft((d) => ({ ...d, to: e.target.value }))
              }
              className="rounded border border-gray-200 px-2 py-1 text-sm"
            />
          </label>
          <button
            onClick={applyFilter}
            disabled={loading}
            className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : totals ? (
          <>
            <StatCard
              label="Total Requests"
              value={fmtNum(totals.requests)}
            />
            <StatCard
              label="Total Cost"
              value={fmtCost(totals.cost_usd)}
            />
            <StatCard
              label="Avg Latency"
              value={fmtMs(totals.avg_latency_ms)}
            />
            <StatCard
              label="Success Rate"
              value={fmtPct(totals.success_rate)}
              sub={`of ${fmtNum(totals.requests)} requests`}
            />
          </>
        ) : null}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      {loading ? (
        <ChartsSkeleton />
      ) : data ? (
        <ChartsSection
          daily={data.daily}
          byProvider={data.stats.by_provider}
          byApiKey={data.stats.by_api_key}
        />
      ) : null}
    </div>
  );
}
