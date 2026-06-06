"use client";

import { useState, useEffect } from "react";
import {
  Copy, Check, Plus, Key, Zap, ArrowRight,
  Activity, DollarSign, X, Terminal,
} from "lucide-react";
import { api, type GatewayKey, type CreateKeyResponse, type ApiKeyStat } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────

function today()         { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const fmtCost = (v: number) => `$${v.toFixed(4)}`;

// ── Copy button ───────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        copied
          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600",
        className,
      )}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── New key reveal banner ─────────────────────────────────────────────────

function NewKeyBanner({ created, onDismiss }: { created: CreateKeyResponse; onDismiss: () => void }) {
  return (
    <div className="rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Key created — save it now
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              This key is shown <strong>once only</strong> and cannot be retrieved again.
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Key value */}
      <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-700/40 bg-white dark:bg-zinc-950 px-4 py-3 mb-3">
        <Terminal className="w-4 h-4 text-zinc-400 shrink-0" />
        <code className="flex-1 font-mono text-sm text-zinc-800 dark:text-zinc-200 break-all">
          {created.key}
        </code>
        <CopyButton text={created.key} />
      </div>

      {/* Usage snippet */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Use in your app</p>
        <code className="font-mono text-xs text-zinc-300 whitespace-pre">{`Authorization: Bearer ${created.key}`}</code>
      </div>
    </div>
  );
}

// ── Key card ──────────────────────────────────────────────────────────────

function KeyCard({ k, stat }: { k: GatewayKey; stat: ApiKeyStat | undefined }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:shadow-sm dark:hover:border-zinc-700 transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <Key className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{k.name}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{fmtDate(k.created_at)}</p>
          </div>
        </div>

        <span className={cn(
          "flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full shrink-0",
          k.is_active
            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400",
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", k.is_active ? "bg-emerald-500" : "bg-zinc-400")} />
          {k.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Masked key */}
      <div className="flex items-center gap-2 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 mb-4">
        <code className="flex-1 font-mono text-xs text-zinc-400">gw_••••••••••••••••••••••</code>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Requests</span>
          </div>
          <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
            {stat ? stat.requests.toLocaleString() : "—"}
          </p>
          <p className="text-[10px] text-zinc-400">last 30 days</p>
        </div>
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Cost</span>
          </div>
          <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
            {stat ? fmtCost(stat.cost_usd) : "—"}
          </p>
          <p className="text-[10px] text-zinc-400">last 30 days</p>
        </div>
      </div>
    </div>
  );
}

function KeyCardSkeleton() {
  function Bone({ className = "" }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800", className)} />;
  }
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Bone className="w-9 h-9 rounded-xl" />
        <div className="space-y-1.5">
          <Bone className="h-4 w-24" />
          <Bone className="h-3 w-16" />
        </div>
      </div>
      <Bone className="h-9 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Bone className="h-16" />
        <Bone className="h-16" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const [keys,        setKeys       ] = useState<GatewayKey[]>([]);
  const [statsMap,    setStatsMap   ] = useState<Map<number, ApiKeyStat>>(new Map());
  const [loading,     setLoading    ] = useState(true);
  const [error,       setError      ] = useState<string | null>(null);
  const [newName,     setNewName    ] = useState("");
  const [creating,    setCreating   ] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newKey,      setNewKey     ] = useState<CreateKeyResponse | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([api.keys.list(), api.stats({ from_date: daysAgo(30), to_date: today() })])
      .then(([ks, stats]) => {
        if (!active) return;
        setKeys(ks);
        const map = new Map<number, ApiKeyStat>();
        stats.by_api_key.forEach(s => { if (s.api_key_id !== null) map.set(s.api_key_id, s); });
        setStatsMap(map);
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Failed"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleCreate() {
    if (!newName.trim() || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await api.keys.create(newName.trim());
      setNewKey(created);
      setKeys(prev => [created, ...prev]);
      setNewName("");
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed");
    } finally {
      setCreating(false);
    }
  }

  const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://your-gateway.fly.dev";

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">API Keys</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Create keys and use them in your app to route LLM calls through the gateway.
        </p>
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50 dark:bg-cyan-950/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-300">How it works</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { n: "1", title: "Create a key below", desc: "Give it a name like 'production' or 'dev'" },
            { n: "2", title: "Use it in your app", desc: "Send requests to your gateway with the key as a Bearer token" },
            { n: "3", title: "Monitor here", desc: "Every call is logged with cost, latency, and token counts" },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-200 dark:bg-cyan-800 flex items-center justify-center text-[10px] font-bold text-cyan-700 dark:text-cyan-300 shrink-0">
                {s.n}
              </span>
              <div>
                <p className="text-xs font-semibold text-cyan-900 dark:text-cyan-200">{s.title}</p>
                <p className="text-[11px] text-cyan-700 dark:text-cyan-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Code snippet */}
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">example request</span>
            <CopyButton
              text={`fetch("${BASE}/v1/chat", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer gw_your_key",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({ model: "llama3-8b-8192", messages: [{ role: "user", content: "Hello!" }] })\n})`}
            />
          </div>
          <pre className="font-mono text-xs text-zinc-300 whitespace-pre overflow-x-auto leading-relaxed">
{`fetch("${BASE}/v1/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer gw_your_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "llama3-8b-8192",
    messages: [{ role: "user", content: "Hello!" }]
  })
})`}
          </pre>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <ArrowRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <p className="text-xs text-cyan-700 dark:text-cyan-400">
            Works with any OpenAI-compatible client — just change the base URL and add your key.
          </p>
        </div>
      </div>

      {/* New key reveal banner */}
      {newKey && <NewKeyBanner created={newKey} onDismiss={() => setNewKey(null)} />}

      {/* Create form */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Create a new key</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            placeholder="e.g. production, my-app, staging"
            disabled={creating}
            className="flex-1 min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-50"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-black transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{creating ? "Creating…" : "Create key"}</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
        {createError && <p className="mt-2 text-xs text-red-500">{createError}</p>}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Keys grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <KeyCardSkeleton key={i} />)}
        </div>
      ) : keys.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {keys.map(k => <KeyCard key={k.id} k={k} stat={statsMap.get(k.id)} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 py-16 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Key className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No keys yet</p>
            <p className="text-xs text-zinc-400 mt-0.5">Create your first key above to start using the gateway</p>
          </div>
        </div>
      )}

      {/* Footer note */}
      {!loading && keys.length > 0 && (
        <p className="text-xs text-zinc-400">
          Keys are stored as SHA-256 hashes. Plaintext is shown once at creation and cannot be recovered.
        </p>
      )}
    </div>
  );
}
