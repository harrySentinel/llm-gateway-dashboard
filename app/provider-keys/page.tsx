"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Check, Trash2, Plus, ShieldCheck, Loader2, Lock, EyeOff, Database, Server, Shield } from "lucide-react";
import { api, type ProviderKeyItem } from "@/lib/api";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference — Llama 3, Mixtral, Gemma",
    docsUrl: "https://console.groq.com/keys",
    placeholder: "gsk_...",
    color: "bg-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900/50",
    models: ["Llama 3 8B", "Llama 3 70B", "Mixtral 8×7B", "Gemma 2 9B"],
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Google's multimodal AI — Gemini 1.5 Flash & Pro",
    docsUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIza...",
    color: "bg-violet-500",
    lightBg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-900/50",
    models: ["Gemini 1.5 Flash", "Gemini 1.5 Pro"],
  },
];

function Bone({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800", className)} />;
}

interface ProviderCardProps {
  provider: typeof PROVIDERS[number];
  existing: ProviderKeyItem | null;
  onSave: (provider: string, key: string) => Promise<void>;
  onRemove: (provider: string) => Promise<void>;
}

function ProviderCard({ provider, existing, onSave, onRemove }: ProviderCardProps) {
  const [input,   setInput  ] = useState("");
  const [saving,  setSaving ] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleSave() {
    if (!input.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(provider.id, input.trim());
      setInput("");
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try { await onRemove(provider.id); }
    catch { /* parent handles refresh */ }
    finally { setRemoving(false); }
  }

  return (
    <div className={cn(
      "rounded-2xl border p-5 transition-all",
      existing
        ? `${provider.lightBg} ${provider.border}`
        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", provider.color)}>
            <span className="text-white text-xs font-bold">{provider.name[0]}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{provider.name}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{provider.description}</p>
          </div>
        </div>

        {existing ? (
          <span className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
            <Check className="w-3 h-3" />
            Connected
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 shrink-0">
            Not connected
          </span>
        )}
      </div>

      {/* Models */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {provider.models.map(m => (
          <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            {m}
          </span>
        ))}
      </div>

      {/* Existing key display */}
      {existing && (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <code className="flex-1 font-mono text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {existing.masked_key}
          </code>
          <span className="text-[10px] text-zinc-400">encrypted</span>
        </div>
      )}

      {/* Actions */}
      {existing ? (
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Replace key
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
          >
            {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Remove
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors",
            showForm
              ? "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
              : `${provider.color} text-white hover:opacity-90`,
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? "Cancel" : `Connect ${provider.name}`}
        </button>
      )}

      {/* Input form */}
      {showForm && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder={provider.placeholder}
              autoFocus
              className="flex-1 min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            <button
              onClick={handleSave}
              disabled={!input.trim() || saving}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 px-3 py-2 text-xs font-semibold text-black transition-colors shrink-0"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Get your {provider.name} API key
          </a>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default function ProviderKeysPage() {
  const [keys,    setKeys   ] = useState<ProviderKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api.providerKeys.list();
      setKeys(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(provider: string, apiKey: string) {
    await api.providerKeys.save(provider, apiKey);
    await load();
  }

  async function handleRemove(provider: string) {
    await api.providerKeys.remove(provider);
    setKeys(k => k.filter(x => x.provider !== provider));
  }

  const keyMap = new Map(keys.map(k => [k.provider, k]));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Provider Keys</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Connect your own API keys — your requests, your billing, your usage.
        </p>
      </div>

      {/* BYOK explanation */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5">
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
          Bring Your Own Key (BYOK)
        </p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Add your Gemini and Groq API keys here. The gateway uses your keys for all LLM requests —
          you pay the providers directly at their standard rates. Keys are encrypted at rest and never exposed after saving.
        </p>
      </div>

      {/* Security notice card */}
      <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-950 dark:to-zinc-900">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">How your keys are protected</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Enterprise-grade security, zero plaintext exposure</p>
          </div>
        </div>

        {/* Security features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800">
          {[
            {
              icon: Lock,
              color: "text-cyan-500",
              bg: "bg-cyan-500/10",
              title: "AES-128 Encryption (Fernet)",
              desc: "Every key is encrypted using Fernet symmetric encryption before it touches the database. Fernet combines AES-128-CBC with HMAC-SHA256 for authenticated encryption.",
            },
            {
              icon: EyeOff,
              color: "text-violet-500",
              bg: "bg-violet-500/10",
              title: "Never stored in plaintext",
              desc: "The moment your key arrives at the server it is encrypted. The raw key string is never written to disk, logs, or any persistent storage — only the encrypted blob.",
            },
            {
              icon: Server,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
              title: "Encryption key in Fly.io Secrets",
              desc: "The master encryption key lives in Fly.io's encrypted secrets vault — completely separate from the database. An attacker with DB access cannot decrypt your keys.",
            },
            {
              icon: Database,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
              title: "Masked on retrieval",
              desc: "After saving, only the first 8 characters are shown (e.g. gsk_AbcD••••••). The full plaintext is never returned by any API endpoint — not even to you.",
            },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 bg-white dark:bg-zinc-900">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">{title}</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer badge */}
        <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <p className="text-[11px] text-zinc-500">
            Your keys are used exclusively to forward your LLM requests. They are never shared, sold, or accessed for any other purpose.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Provider cards */}
      {loading ? (
        <div className="space-y-4">
          <Bone className="h-48" />
          <Bone className="h-48" />
        </div>
      ) : (
        <div className="space-y-4">
          {PROVIDERS.map(p => (
            <ProviderCard
              key={p.id}
              provider={p}
              existing={keyMap.get(p.id) ?? null}
              onSave={handleSave}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
