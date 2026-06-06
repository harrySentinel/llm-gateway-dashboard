"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { DollarSign, Timer, RefreshCw } from "lucide-react";
import { api, type StatsResponse, type DailyStat, type GatewayKey } from "@/lib/api";
import { GatewayStatsCard } from "@/components/ui/gateway-stats-card";
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

const fmtCost = (v: number) => `$${v.toFixed(4)}`;
const fmtMs   = (v: number) => `${Math.round(v).toLocaleString()}ms`;

// ── Skeleton ──────────────────────────────────────────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800", className)} />;
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

// ── Small stat card (cost / latency) ─────────────────────────────────────

function MiniStat({
  label, value, icon: Icon, color, bg,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div>
        <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white">{value}</p>
        <p className="text-[10px] uppercase tracking-widest font-medium text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

// ── Presets ───────────────────────────────────────────────────────────────

const PRESETS = [
  { label: "7d",  days: 7  },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

// ── Page ──────────────────────────────────────────────────────────────────

type PageData = {
  stats: StatsResponse;
  daily: DailyStat[];
  keys:  GatewayKey[];
};

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
      api.keys.list(),
    ])
      .then(([stats, daily, keys]) => { if (active) setData({ stats, daily, keys }); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Failed"); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [applied]);

  useEffect(() => { return fetchData(); }, [fetchData]);

  function applyPreset(days: number) {
    const next = { from: daysAgo(days), to: today() };
    setDraft(next); setApplied(next); setActivePreset(days);
  }

  const totals = data?.stats?.totals;

  // Build provider breakdown for the animated card
  const breakdown = data?.stats?.by_provider.length
    ? data.stats.by_provider.map((p, i) => {
        const colors = ["bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-cyan-500"];
        const total  = data.stats.by_provider.reduce((s, x) => s + x.requests, 0) || 1;
        return {
          label: p.provider,
          pct:   Math.round((p.requests / total) * 100),
          color: colors[i % colors.length],
        };
      })
    : [
        { label: "Groq",   pct: 60, color: "bg-blue-500"   },
        { label: "Gemini", pct: 40, color: "bg-violet-500" },
      ];

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Header + date filter */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Overview</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Gateway usage and cost</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

          <div className="flex items-center gap-1.5">
            <input
              type="date" value={draft.from} max={draft.to}
              onChange={(e) => { setDraft(d => ({ ...d, from: e.target.value })); setActivePreset(null); }}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>
            <input
              type="date" value={draft.to} min={draft.from} max={today()}
              onChange={(e) => { setDraft(d => ({ ...d, to: e.target.value })); setActivePreset(null); }}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            {!activePreset && (
              <button
                onClick={() => setApplied(draft)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
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

      {/* Animated gateway stats card */}
      {loading ? (
        <Bone className="h-64 w-full" />
      ) : (
        <GatewayStatsCard
          requests={{
            total:       totals?.requests ?? 0,
            successRate: totals?.success_rate ?? 0,
            breakdown,
          }}
          keys={{
            count: data?.keys.length ?? 0,
            names: (data?.keys ?? []).map(k => k.name),
          }}
        />
      )}

      {/* Cost + latency mini cards */}
      {!loading && totals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MiniStat
            label="Total cost"
            value={fmtCost(totals.cost_usd)}
            icon={DollarSign}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <MiniStat
            label="Avg latency"
            value={fmtMs(totals.avg_latency_ms)}
            icon={Timer}
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
        </div>
      )}

      {/* Charts */}
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
