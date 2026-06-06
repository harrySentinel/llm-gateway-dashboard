"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square, ChevronDown, Zap, Copy, Check, GitCompare } from "lucide-react";
import { streamChat, type Message, type StreamUsage } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Models ────────────────────────────────────────────────────────────────

const MODELS = [
  { value: "llama3-8b-8192",          label: "Llama 3 8B",          provider: "Groq"   },
  { value: "llama-3.1-8b-instant",    label: "Llama 3.1 8B Instant", provider: "Groq"  },
  { value: "llama3-70b-8192",         label: "Llama 3 70B",          provider: "Groq"   },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B",        provider: "Groq"   },
  { value: "mixtral-8x7b-32768",      label: "Mixtral 8×7B",         provider: "Groq"   },
  { value: "gemma2-9b-it",            label: "Gemma 2 9B",           provider: "Groq"   },
  { value: "gemini-1.5-flash",        label: "Gemini 1.5 Flash",     provider: "Google" },
  { value: "gemini-1.5-pro",          label: "Gemini 1.5 Pro",       provider: "Google" },
];

type Status = "idle" | "streaming" | "done" | "error";

interface RunState {
  output:    string;
  status:    Status;
  error:     string | null;
  usage:     StreamUsage | null;
  latencyMs: number | null;
}

const IDLE: RunState = { output: "", status: "idle", error: null, usage: null, latencyMs: null };

// ── Model pill selector ───────────────────────────────────────────────────

function ModelPicker({
  value, onChange, disabled, label,
}: {
  value: string; onChange: (v: string) => void; disabled?: boolean; label?: string;
}) {
  const m = MODELS.find(x => x.value === value) ?? MODELS[0];
  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-[10px] uppercase tracking-widest font-medium text-zinc-500">{label}</p>}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-3 pr-8 py-2 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-50 cursor-pointer"
        >
          {MODELS.map(m => (
            <option key={m.value} value={m.value}>{m.provider} — {m.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
      </div>
      <div className="flex items-center gap-1.5 px-1">
        <span className={cn(
          "inline-block w-1.5 h-1.5 rounded-full",
          m.provider === "Groq" ? "bg-blue-500" : "bg-violet-500",
        )} />
        <span className="text-[10px] text-zinc-400">{m.provider}</span>
      </div>
    </div>
  );
}

// ── Output terminal ───────────────────────────────────────────────────────

function Terminal({ model, run }: { model: string; run: RunState }) {
  const [copied, setCopied] = useState(false);
  const m = MODELS.find(x => x.value === model);

  function copy() {
    if (!run.output) return;
    navigator.clipboard.writeText(run.output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 flex-1">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 ml-1">
            {m?.provider} / {m?.label ?? model}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {run.status === "streaming" && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-500">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              streaming
            </span>
          )}
          {run.status === "done" && (
            <span className="text-[10px] text-emerald-500">done</span>
          )}
          {run.output && (
            <button
              onClick={copy}
              className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Output body */}
      <div className="flex-1 min-h-48 p-5 font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words overflow-y-auto">
        {run.status === "idle" && !run.output && (
          <div className="flex flex-col items-center justify-center h-full min-h-32 gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Zap className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Ready to run</p>
              <p className="text-xs text-zinc-500 mt-0.5">Write a prompt above and click Send</p>
            </div>
          </div>
        )}
        {run.output}
        {run.status === "streaming" && (
          <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-cyan-500" />
        )}
      </div>

      {/* Stats footer */}
      {(run.status === "done" || run.status === "error") && (
        <div className={cn(
          "flex flex-wrap gap-4 px-4 py-2.5 text-xs border-t",
          run.status === "error"
            ? "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
            : "border-zinc-100 dark:border-zinc-800 text-zinc-400",
        )}>
          {run.status === "error" ? (
            <span>{run.error}</span>
          ) : (
            <>
              <span className="font-mono">
                ⏱ {run.latencyMs !== null ? `${run.latencyMs.toLocaleString()}ms` : "—"}
              </span>
              {run.usage ? (
                <>
                  <span className="font-mono">↑ {run.usage.prompt_tokens.toLocaleString()} prompt</span>
                  <span className="font-mono">↓ {run.usage.completion_tokens.toLocaleString()} completion</span>
                  <span className="font-mono">Σ {run.usage.total_tokens.toLocaleString()} total</span>
                </>
              ) : (
                <span className="italic opacity-60">usage not returned by provider</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const [prompt,     setPrompt    ] = useState("");
  const [leftModel,  setLeftModel ] = useState("llama3-8b-8192");
  const [rightModel, setRightModel] = useState("gemini-1.5-flash");
  const [compare,    setCompare   ] = useState(false);
  const [leftRun,    setLeftRun   ] = useState<RunState>(IDLE);
  const [rightRun,   setRightRun  ] = useState<RunState>(IDLE);

  const abortsRef = useRef<AbortController[]>([]);
  useEffect(() => () => abortsRef.current.forEach(ac => ac.abort()), []);

  const isRunning = leftRun.status === "streaming" || rightRun.status === "streaming";

  const runPanel = useCallback(
    (model: string, setter: React.Dispatch<React.SetStateAction<RunState>>) => {
      const ac = new AbortController();
      abortsRef.current.push(ac);
      const t0 = performance.now();
      setter({ ...IDLE, status: "streaming" });

      streamChat(
        { model, messages: [{ role: "user" as Message["role"], content: prompt.trim() }] },
        {
          signal: ac.signal,
          onToken(token) {
            if (ac.signal.aborted) return;
            setter(p => ({ ...p, output: p.output + token }));
          },
          onComplete(usage) {
            if (ac.signal.aborted) return;
            setter(p => ({ ...p, status: "done", usage, latencyMs: Math.round(performance.now() - t0) }));
          },
          onError(err) {
            if (ac.signal.aborted) return;
            setter(p => ({ ...p, status: "error", error: err.message }));
          },
        },
      );
    },
    [prompt],
  );

  const handleSend = useCallback(() => {
    if (!prompt.trim() || isRunning) return;
    abortsRef.current.forEach(ac => ac.abort());
    abortsRef.current = [];
    runPanel(leftModel, setLeftRun);
    if (compare) runPanel(rightModel, setRightRun);
    else setRightRun(IDLE);
  }, [prompt, isRunning, compare, leftModel, rightModel, runPanel]);

  const handleStop = useCallback(() => {
    abortsRef.current.forEach(ac => ac.abort());
    abortsRef.current = [];
    setLeftRun(p => p.status === "streaming" ? { ...p, status: "idle" } : p);
    setRightRun(p => p.status === "streaming" ? { ...p, status: "idle" } : p);
  }, []);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto h-full">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Playground</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Chat with any model via your gateway — pick a model, write a prompt, hit Send
          </p>
        </div>

        {/* Compare toggle */}
        <button
          onClick={() => setCompare(c => !c)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
            compare
              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
              : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900",
          )}
        >
          <GitCompare className="w-4 h-4" />
          Compare
        </button>
      </div>

      {/* Model selectors */}
      <div className={cn("grid gap-4", compare ? "grid-cols-2" : "grid-cols-1 max-w-xs")}>
        <ModelPicker
          value={leftModel}
          onChange={setLeftModel}
          disabled={isRunning}
          label={compare ? "Model A" : "Model"}
        />
        {compare && (
          <ModelPicker
            value={rightModel}
            onChange={setRightModel}
            disabled={isRunning}
            label="Model B"
          />
        )}
      </div>

      {/* Prompt input */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500/30 focus-within:border-cyan-500/50 transition-all">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Write your prompt here… (⌘ + Enter to send)"
          rows={4}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <p className="text-[10px] text-zinc-400">
            {prompt.length > 0 ? `${prompt.length} chars` : "⌘ + Enter to send"}
          </p>
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!prompt.trim()}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 px-4 py-2 text-sm font-semibold text-black transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Output panels */}
      <div className={cn("grid gap-4 flex-1", compare ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
        <Terminal model={leftModel} run={leftRun} />
        {compare && <Terminal model={rightModel} run={rightRun} />}
      </div>

    </div>
  );
}
