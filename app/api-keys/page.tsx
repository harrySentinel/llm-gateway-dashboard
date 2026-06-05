"use client";

import { useState, useEffect } from "react";
import {
  api,
  type GatewayKey,
  type CreateKeyResponse,
  type ApiKeyStat,
} from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const fmtCost = (v: number) => `$${v.toFixed(4)}`;

// ── Skeleton primitive ────────────────────────────────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />;
}

// ── New-key banner ────────────────────────────────────────────────────────
// Shown exactly once after creation. Dismissed by the user.

function NewKeyBanner({
  created,
  onDismiss,
}: {
  created: CreateKeyResponse;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(created.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-900">
            Key created — copy it now
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            This key will <strong>never be shown again</strong>. Store it
            somewhere safe before dismissing.
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-amber-400 hover:text-amber-700 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Key display */}
      <div className="flex items-center gap-2 rounded border border-amber-200 bg-white px-3 py-2">
        <code className="flex-1 break-all font-mono text-sm text-gray-800">
          {created.key}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded border border-gray-200 px-2 py-1 text-xs transition-colors hover:bg-gray-50"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Key metadata */}
      <p className="text-xs text-amber-700">
        Name: <strong>{created.name}</strong> · Created{" "}
        {fmtDate(created.created_at)}
      </p>
    </div>
  );
}

// ── Keys table ────────────────────────────────────────────────────────────

const COL_COUNT = 6;

function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: COL_COUNT }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Bone className={`h-4 ${j === 0 ? "w-32" : "w-20"}`} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500",
      ].join(" ")}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function KeyRow({
  k,
  stat,
}: {
  k: GatewayKey;
  stat: ApiKeyStat | undefined;
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Name */}
      <td className="px-4 py-3 text-sm font-medium">{k.name}</td>

      {/* Masked prefix — actual key never stored, only hash */}
      <td className="px-4 py-3 font-mono text-sm text-gray-400">
        gw_••••••••••••
      </td>

      {/* Created date */}
      <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(k.created_at)}</td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge active={k.is_active} />
      </td>

      {/* Requests (last 30 d) */}
      <td className="px-4 py-3 text-right tabular-nums text-sm text-gray-600">
        {stat ? stat.requests.toLocaleString() : "—"}
      </td>

      {/* Cost (last 30 d) */}
      <td className="px-4 py-3 text-right tabular-nums text-sm text-gray-600">
        {stat ? fmtCost(stat.cost_usd) : "—"}
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const [keys, setKeys]             = useState<GatewayKey[]>([]);
  const [statsMap, setStatsMap]     = useState<Map<number, ApiKeyStat>>(new Map());
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Create-key form
  const [newName, setNewName]       = useState("");
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // One-time reveal banner
  const [newKey, setNewKey]         = useState<CreateKeyResponse | null>(null);

  // ── Fetch keys + 30-day usage stats in parallel ───────────────────────
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.keys.list(),
      api.stats({ from_date: daysAgo(30), to_date: today() }),
    ])
      .then(([ks, stats]) => {
        if (!active) return;
        setKeys(ks);
        // Build id → stat lookup for the table
        const map = new Map<number, ApiKeyStat>();
        stats.by_api_key.forEach((s) => {
          if (s.api_key_id !== null) map.set(s.api_key_id, s);
        });
        setStatsMap(map);
      })
      .catch((e: unknown) => {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load keys");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // ── Create key ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await api.keys.create(newName.trim());
      // Reveal banner — key is shown once here, never again
      setNewKey(created);
      // Optimistically prepend to the list (avoids a full re-fetch)
      setKeys((prev) => [created, ...prev]);
      setNewName("");
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCreate();
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold">API Keys</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Keys authenticate requests to the gateway.
          Usage shown for the last 30 days.
        </p>
      </div>

      {/* ── New-key reveal banner ─────────────────────────────────────────── */}
      {newKey && (
        <NewKeyBanner
          created={newKey}
          onDismiss={() => setNewKey(null)}
        />
      )}

      {/* ── Create form ──────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-medium">Create a new key</p>

        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Key name — e.g. my-app, staging"
            disabled={creating}
            className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="rounded bg-gray-900 px-4 py-1.5 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-40"
          >
            {creating ? "Creating…" : "Create key"}
          </button>
        </div>

        {createError && (
          <p className="text-xs text-red-600">{createError}</p>
        )}
      </div>

      {/* ── Fetch error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Keys table ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Requests (30 d)</th>
              <th className="px-4 py-3 text-right">Cost (30 d)</th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton />
          ) : keys.length > 0 ? (
            <tbody>
              {keys.map((k) => (
                <KeyRow key={k.id} k={k} stat={statsMap.get(k.id)} />
              ))}
            </tbody>
          ) : (
            <tbody>
              <tr>
                <td
                  colSpan={COL_COUNT}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  No keys yet. Create one above to start using the gateway.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      {!loading && keys.length > 0 && (
        <p className="text-xs text-gray-400">
          Keys are stored as SHA-256 hashes. Plaintext is shown once at
          creation and cannot be recovered.
        </p>
      )}
    </div>
  );
}
