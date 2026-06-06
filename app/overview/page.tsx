"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Zap, DollarSign, Timer, CheckCircle2 } from "lucide-react";
import { api, type StatsResponse, type DailyStat } from "@/lib/api";
import { cn } from "@/lib/utils";

const ChartsSection = dynamic(() => import("./charts"), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
});

// ── Helpers ───────────────────────────────────────────────────────────────

function today()       { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const fmtNum  = (v: number) => v.toLocaleString();
const fmtCost = (v: number) => `$${v.toFixed(4)}`;
const fmtMs   = (v: number) => `${Math.round(v).toLocaleString()} ms`;
const fmtPct  = (v: number) => `${(v * 100).toFixed(1)}%`;

// ── Skeletons ─────────────────────────────────────────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <Bone className="h-9 w-9 rounded-lg" />
      <div className="space-y-1.5">
        <Bone className="h-7 w-24" />
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
        <Bone className="h-[260px]" />
        <Bone className="h-[260px]" />
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-4", accent)}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-widest font-medium text-muted-foreground">
        {label}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-muted-foreground/60">{sub}</p>
      )}
    </div>
  );
}

// ── Preset buttons ────────────────────────────────────────────────────────

const PRESETS = [
  { label: "7d",  days: 7  },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

// ── Page ──────────────────────────────────────────────────────────────────

type PageData = { stats: StatsResponse; daily: DailyStat[] };

export default function OverviewPage() {
  const [draft,   setDraft  ] = useState({ from: daysAgo(30), to: today() });
  const [applied, setApplied] = useState(draft);
  const [activePreset, setActivePreset] = useState<number | null>(30);

  const [data,    setData   ] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.stats({ from_date: applied.from, to_date: applied.to }),
      api.daily({ from_date: applied.from, to_date: applied.to }),
    ])
      .then(([stats, daily]) => { if (active) setData({ stats, daily }); })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [applied]);

  useEffect(() => { return fetchData(); }, [fetchData]);

  function applyPreset(days: number) {
    const next = { from: daysAgo(days), to: today() };
    setDraft(next);
    setApplied(next);
    setActivePreset(days);
  }

  function applyCustom() {
    setApplied(draft);
    setActivePreset(null);
  }

  const { totals } = data?.stats ?? {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">Gateway usage and cost</p>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Presets */}
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5 gap-0.5">
            {PRESETS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => applyPreset(days)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  activePreset === days
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={draft.from}
              max={draft.to}
              onChange={(e) => { setDraft((d) => ({ ...d, from: e.target.value })); setActivePreset(null); }}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <input
              type="date"
              value={draft.to}
              min={draft.from}
              max={today()}
              onChange={(e) => { setDraft((d) => ({ ...d, to: e.target.value })); setActivePreset(null); }}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {!activePreset && (
              <button
                onClick={applyCustom}
                disabled={loading}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : totals ? (
          <>
            <StatCard
              label="Requests"
              value={fmtNum(totals.requests)}
              icon={Zap}
              accent="bg-blue-500/10 text-blue-500"
            />
            <StatCard
              label="Total Cost"
              value={fmtCost(totals.cost_usd)}
              icon={DollarSign}
              accent="bg-emerald-500/10 text-emerald-500"
            />
            <StatCard
              label="Avg Latency"
              value={fmtMs(totals.avg_latency_ms)}
              sub="per request"
              icon={Timer}
              accent="bg-amber-500/10 text-amber-500"
            />
            <StatCard
              label="Success Rate"
              value={fmtPct(totals.success_rate)}
              sub={`${fmtNum(totals.requests)} total`}
              icon={CheckCircle2}
              accent="bg-cyan-500/10 text-cyan-500"
            />
          </>
        ) : null}
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
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
