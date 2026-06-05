"use client";

/**
 * Recharts chart components for the Overview page.
 * Imported via next/dynamic with { ssr: false } so recharts never runs
 * during server-side rendering (it accesses ResizeObserver / window).
 */

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { DailyStat, ProviderStat, ApiKeyStat } from "@/lib/api";

// ── Shared formatters ─────────────────────────────────────────────────────

const fmtCost = (v: number) => `$${v.toFixed(4)}`;
const fmtDate = (s: string) => {
  // Append time so Date parses as local, not UTC (avoids off-by-one-day)
  const d = new Date(`${s}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ── Section wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-sm font-medium text-gray-700 mb-4">{title}</p>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div className="h-48 flex items-center justify-center text-sm text-gray-400">
      No data for this period
    </div>
  );
}

// ── Cost over time ────────────────────────────────────────────────────────

function CostOverTime({ data }: { data: DailyStat[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDate}
          tick={{ fontSize: 11 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={fmtCost}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip
          formatter={(v) => [fmtCost(Number(v ?? 0)), "Cost"]}
          labelFormatter={(l) => fmtDate(String(l))}
        />
        <Line
          type="monotone"
          dataKey="cost_usd"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Requests by provider ──────────────────────────────────────────────────

function RequestsByProvider({ data }: { data: ProviderStat[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="provider" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v) => [Number(v ?? 0).toLocaleString(), "Requests"]} />
        <Bar dataKey="requests" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={64} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Cost by API key ───────────────────────────────────────────────────────

function CostByApiKey({ data }: { data: ApiKeyStat[] }) {
  if (!data.length) return <Empty />;
  const display = data.map((d) => ({
    ...d,
    label: d.api_key_name ?? "Unknown",
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={display}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={fmtCost}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          width={80}
        />
        <Tooltip formatter={(v) => [fmtCost(Number(v ?? 0)), "Cost"]} />
        <Bar dataKey="cost_usd" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Combined export (default — required by next/dynamic) ──────────────────

interface ChartsSectionProps {
  daily: DailyStat[];
  byProvider: ProviderStat[];
  byApiKey: ApiKeyStat[];
}

export default function ChartsSection({
  daily,
  byProvider,
  byApiKey,
}: ChartsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Full-width time series */}
      <ChartCard title="Cost over time">
        <CostOverTime data={daily} />
      </ChartCard>

      {/* Two side-by-side charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="Requests by provider">
          <RequestsByProvider data={byProvider} />
        </ChartCard>

        <ChartCard title="Cost by API key">
          <CostByApiKey data={byApiKey} />
        </ChartCard>
      </div>
    </div>
  );
}
