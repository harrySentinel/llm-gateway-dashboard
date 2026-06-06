"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Zap, DollarSign, Timer, CheckCircle2, RefreshCw } from "lucide-react";
import { api, type StatsResponse, type DailyStat } from "@/lib/api";
import { cn } from "@/lib/utils";

const ChartsSection = dynamic(() => import("./charts"), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
});

function today()         { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const fmtNum  = (v: number) => v.toLocaleString();
const fmtCost = (v: number) => `$${v.toFixed(4)}`;
const fmtMs   = (v: number) => `${Math.round(v).toLocaleString()}ms`;
const fmtPct  = (v: number) => `${(v * 100).toFixed(1)}%`;

// ── Skeleton ──────────────────────────────────────────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800", className)} />;
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
      <Bone className="h-8 w-8 rounded-lg" />
      <div className="space-y-2">
        <Bone className="h-9 w-28" />
        <Bone className="h-3 w-20" />
      </div>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="space-y-4">
      <Bone className="h-[260px] w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Bone className="h-[240px]" />
        <Bone className="h-[240px]" />
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────

const CARDS = [
  {
    key: "requests"    as const,
    label: "Requests",
    icon: Zap,
    color: "text-blue-500",
    bg:    "bg-blue-500/10",
    getValue: (t: NonNullable<StatsResponse["totals"]>) => fmtNum(t.requests),
  },
  {
    key: "cost"        as const,
    label: "Total cost",
    icon: DollarSign,
    color: "text-emerald-500",
    bg:    "bg-emerald-500/10",
    getValue: (t: NonNullable<StatsResponse["totals"]>) => fmtCost(t.cost_usd),
  },
  {
    key: "latency"     as const,
    label: "Avg latency",
    icon: Timer,
    color: "text-amber-500",
    bg:    "bg-amber-500/10",
    getValue: (t: NonNullable<StatsResponse["totals"]>) => fmtMs(t.avg_latency_ms),
    sub: "per request",
  },
  {
    key: "success"     as const,
    label: "Success rate",
    icon: CheckCircle2,
    color: "text-cyan-500",
    bg:    "bg-cyan-500/10",
    getValue: (t: NonNullable<StatsResponse["totals"]>) => fmtPct(t.success_rate),
    getSub: (t: NonNullable<StatsResponse["totals"]>) => `of ${fmtNum(t.requests)} requests`,
  },
];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:shadow-md dark:hover:border-zinc-700 transition-all duration-200">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-4", bg)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white leading-none">
        {value}
      </p>
      <p className="mt-2 text-xs uppercase tracking-widest font-medium text-zinc-400">
        {label}
      </p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400/70">{sub}</p>}
    </div>
  );
}

// ── Preset tabs ───────────────────────────────────────────────────────────

const PRESETS = [
  { label: "7d",  days: 7  },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

// ── Page ──────────────────────────────────────────────────────────────────

type PageData = { stats: StatsResponse; daily: DailyStat[] };

export default function OverviewPage() {
  const [draft,        setDraft       ] = useState({ from: daysAgo(30), to: today() });
  const [applied,      setApplied     ] = useState(draft);
  const [activePreset, setActivePreset] = useState<number | null>(30);
  const [data,         setData        ] = useState<PageData | null>(null);
  const [loading,      setLoading     ] = useState(true);
  const [error,        setError       ] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.stats({ from_date: applied.from, to_date: applied.to }),
      api.daily({ from_date: applied.from, to_date: applied.to }),
    ])
      .then(([stats, daily]) => { if (active) setData({ stats, daily }); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Failed"); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [applied]);

  useEffect(() => { return fetchData(); }, [fetchData]);

  function applyPreset(days: number) {
    const next = { from: daysAgo(days), to: today() };
    setDraft(next); setApplied(next); setActivePreset(days);
  }

  const { totals } = data?.stats ?? {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Overview</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Gateway usage and cost summary</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset tabs */}
          <div className="flex items-center gap-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1">
            {PRESETS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => applyPreset(days)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activePreset === days
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom dates */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={draft.from}
              max={draft.to}
              onChange={(e) => { setDraft(d => ({ ...d, from: e.target.value })); setActivePreset(null); }}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>
            <input
              type="date"
              value={draft.to}
              min={draft.from}
              max={today()}
              onChange={(e) => { setDraft(d => ({ ...d, to: e.target.value })); setActivePreset(null); }}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            {!activePreset && (
              <button
                onClick={() => { setApplied(draft); }}
                disabled={loading}
                className="rounded-xl bg-zinc-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                Apply
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : totals
          ? CARDS.map((card) => (
              <StatCard
                key={card.key}
                label={card.label}
                value={card.getValue(totals)}
                sub={"getSub" in card ? card.getSub?.(totals) : card.sub}
                icon={card.icon}
                color={card.color}
                bg={card.bg}
              />
            ))
          : null}
      </div>

      {/* Charts */}
      {loading
        ? <ChartsSkeleton />
        : data
        ? <ChartsSection daily={data.daily} byProvider={data.stats.by_provider} byApiKey={data.stats.by_api_key} />
        : null}
    </div>
  );
}
