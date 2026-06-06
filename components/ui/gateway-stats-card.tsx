"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Activity, Terminal, ArrowRight, CheckCircle2, AlertCircle, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

// ── Animated number ───────────────────────────────────────────────────────

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString(),
  );
  React.useEffect(() => {
    const ctrl = animate(count, value, { duration: 1.4, ease: "easeOut" });
    return ctrl.stop;
  }, [value, count]);
  return <motion.span>{rounded}</motion.span>;
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface GatewayStatsCardProps {
  requests: {
    total: number;
    successRate: number; // 0-1
    breakdown: Array<{ label: string; pct: number; color: string }>;
  };
  keys: {
    count: number;
    names: string[]; // first 4 shown as avatar initials
  };
  className?: string;
}

// ── Main component ────────────────────────────────────────────────────────

export function GatewayStatsCard({ requests, keys, className }: GatewayStatsCardProps) {
  const spring = { type: "spring" as const, stiffness: 260, damping: 18 };

  const container = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.09 } },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  const successPct = Math.round(requests.successRate * 100);
  const errorPct   = 100 - successPct;

  return (
    <motion.div
      className={cn(
        "w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5",
        className,
      )}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Gateway Activity
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Live usage snapshot</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-zinc-400">Live</span>
        </div>
      </motion.div>

      {/* Cards row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-3">

        {/* Request Activity */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.02, y: -3 }}
          transition={spring}
        >
          <Card className="h-full rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-zinc-500">Requests</p>
                <Activity className="w-4 h-4 text-zinc-400" />
              </div>

              <div className="mb-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-white tabular-nums">
                  <AnimatedNumber value={requests.total} />
                </span>
                <span className="ml-2 text-xs text-zinc-400">total</span>
              </div>

              {/* Provider breakdown bar */}
              <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex overflow-hidden my-3">
                {requests.breakdown.map((seg, i) => (
                  <motion.div
                    key={i}
                    className={cn("h-full", seg.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${seg.pct}%` }}
                    transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3">
                {requests.breakdown.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-1">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", seg.color)} />
                    <span className="text-[10px] text-zinc-500">{seg.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Success rate + API keys */}
        <div className="flex flex-col gap-3">

          {/* Success rate */}
          <motion.div variants={item} whileHover={{ scale: 1.02, y: -3 }} transition={spring}>
            <Card className="rounded-xl border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Success rate</p>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 tabular-nums">
                    <AnimatedNumber value={successPct} />%
                  </span>
                  {errorPct > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-red-500">
                      <AlertCircle className="w-3 h-3" />
                      {errorPct}% errors
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* API Keys */}
          <motion.div variants={item} whileHover={{ scale: 1.02, y: -3 }} transition={spring}>
            <Card className="rounded-xl border-cyan-200 dark:border-cyan-900/50 bg-cyan-50 dark:bg-cyan-950/30 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400">API Keys</p>
                  <Key className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-cyan-900 dark:text-cyan-100 tabular-nums">
                    <AnimatedNumber value={keys.count} />
                  </span>
                  <div className="flex -space-x-2">
                    {keys.names.slice(0, 4).map((name, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.7 + i * 0.08 }}
                        whileHover={{ scale: 1.15, zIndex: 10 }}
                      >
                        <Avatar className="w-7 h-7 border-2 border-cyan-100 dark:border-cyan-900">
                          <AvatarFallback className="text-[9px] bg-cyan-200 dark:bg-cyan-800 text-cyan-900 dark:text-cyan-100">
                            {name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <motion.div variants={item} whileHover={{ scale: 1.01 }} transition={spring}>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-950 dark:bg-white/5 border border-zinc-800 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-sm text-zinc-400">Test your gateway live in the Playground</p>
          </div>
          <Button size="sm" asChild className="shrink-0 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
            <Link href="/playground">
              Try it <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
