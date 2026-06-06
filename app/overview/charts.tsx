"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
} from "recharts";
import type { DailyStat, ProviderStat, ApiKeyStat } from "@/lib/api";
import { cn } from "@/lib/utils";

const fmtCost = (v: number) => `$${v.toFixed(4)}`;
const fmtDate = (s: string) => {
  const d = new Date(`${s}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ── Theme-aware colors ────────────────────────────────────────────────────

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  return {
    grid:    dark ? "#27272a" : "#e4e4e7",
    axis:    dark ? "#71717a" : "#a1a1aa",
    tooltip: dark ? "#18181b" : "#ffffff",
    border:  dark ? "#27272a" : "#e4e4e7",
  };
}

// ── Card wrapper ──────────────────────────────────────────────────────────

function ChartCard({ title, children, className = "" }: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-5">
        {title}
      </p>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
      No data for this period
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, formatter }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      {label && <p className="text-muted-foreground mb-1">{fmtDate(String(label))}</p>}
      <p className="font-semibold text-foreground">{formatter(payload[0].value)}</p>
    </div>
  );
}

// ── Cost over time ────────────────────────────────────────────────────────

function CostOverTime({ data }: { data: DailyStat[] }) {
  const c = useChartColors();
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDate}
          tick={{ fontSize: 11, fill: c.axis }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={fmtCost}
          tick={{ fontSize: 11, fill: c.axis }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          content={<CustomTooltip formatter={fmtCost} />}
        />
        <Line
          type="monotone"
          dataKey="cost_usd"
          stroke="#06b6d4"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#06b6d4", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Requests by provider ──────────────────────────────────────────────────

function RequestsByProvider({ data }: { data: ProviderStat[] }) {
  const c = useChartColors();
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="provider" tick={{ fontSize: 11, fill: c.axis }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: c.axis }} tickLine={false} axisLine={false} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
                <p className="font-semibold text-foreground">{Number(payload[0].value).toLocaleString()} requests</p>
              </div>
            );
          }}
        />
        <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Cost by API key ───────────────────────────────────────────────────────

function CostByApiKey({ data }: { data: ApiKeyStat[] }) {
  const c = useChartColors();
  if (!data.length) return <Empty />;
  const display = data.map((d) => ({ ...d, label: d.api_key_name ?? "Unknown" }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={display} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
        <XAxis type="number" tickFormatter={fmtCost} tick={{ fontSize: 11, fill: c.axis }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: c.axis }} tickLine={false} width={72} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
                <p className="font-semibold text-foreground">{fmtCost(Number(payload[0].value))}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="cost_usd" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Export ────────────────────────────────────────────────────────────────

interface ChartsSectionProps {
  daily: DailyStat[];
  byProvider: ProviderStat[];
  byApiKey: ApiKeyStat[];
}

export default function ChartsSection({ daily, byProvider, byApiKey }: ChartsSectionProps) {
  return (
    <div className="space-y-4">
      <ChartCard title="Cost over time">
        <CostOverTime data={daily} />
      </ChartCard>
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
