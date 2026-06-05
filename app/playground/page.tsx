"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { streamChat, type Message, type StreamUsage } from "@/lib/api";

// ── Model catalogue ───────────────────────────────────────────────────────

const MODELS = [
  { value: "llama3-8b-8192",           label: "Groq · Llama 3 8B" },
  { value: "llama-3.1-8b-instant",     label: "Groq · Llama 3.1 8B Instant" },
  { value: "llama3-70b-8192",          label: "Groq · Llama 3 70B" },
  { value: "llama-3.3-70b-versatile",  label: "Groq · Llama 3.3 70B Versatile" },
  { value: "mixtral-8x7b-32768",       label: "Groq · Mixtral 8×7B" },
  { value: "gemma2-9b-it",             label: "Groq · Gemma 2 9B" },
  { value: "gemini-1.5-flash",         label: "Gemini · 1.5 Flash" },
  { value: "gemini-1.5-pro",           label: "Gemini · 1.5 Pro" },
];

// ── Types ─────────────────────────────────────────────────────────────────

type Status = "idle" | "streaming" | "done" | "error";

interface RunState {
  output: string;
  status: Status;
  error: string | null;
  usage: StreamUsage | null;
  latencyMs: number | null;
}

const IDLE: RunState = {
  output: "", status: "idle", error: null, usage: null, latencyMs: null,
};

// ── Sub-components ────────────────────────────────────────────────────────

function ModelSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="rounded border border-gray-200 bg-white px-2 py-1.5 text-sm disabled:opacity-50"
    >
      {MODELS.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}

function OutputPanel({
  model,
  run,
}: {
  model: string;
  run: RunState;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 overflow-hidden">
      {/* Panel header — model name */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
        <span className="text-xs font-medium text-gray-600">{model}</span>
        {run.status === "streaming" && (
          <span className="text-xs text-gray-400">streaming…</span>
        )}
        {run.status === "done" && (
          <span className="text-xs text-gray-400">done</span>
        )}
      </div>

      {/* Output body */}
      <div className="min-h-64 flex-1 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
        {run.output}
        {/* Blinking cursor while streaming */}
        {run.status === "streaming" && (
          <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-gray-700" />
        )}
        {/* Placeholder */}
        {run.status === "idle" && !run.output && (
          <span className="text-gray-300">Output will appear here…</span>
        )}
      </div>

      {/* Footer: stats or error */}
      {run.status === "done" && (
        <div className="flex gap-4 border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
          <span title="Client-side latency from Send to last token">
            ⏱ {run.latencyMs !== null ? `${run.latencyMs.toLocaleString()} ms` : "—"}
          </span>
          {run.usage ? (
            <>
              <span title="Prompt tokens">↑ {run.usage.prompt_tokens.toLocaleString()}</span>
              <span title="Completion tokens">↓ {run.usage.completion_tokens.toLocaleString()}</span>
              <span title="Total tokens">Σ {run.usage.total_tokens.toLocaleString()}</span>
            </>
          ) : (
            <span className="italic text-gray-300" title="Provider did not return usage in stream">
              tokens —
            </span>
          )}
        </div>
      )}

      {run.status === "error" && run.error && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {run.error}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const [prompt, setPrompt]         = useState("");
  const [leftModel, setLeftModel]   = useState("llama3-8b-8192");
  const [rightModel, setRightModel] = useState("gemini-1.5-flash");
  const [compareMode, setCompare]   = useState(false);

  const [leftRun, setLeftRun]   = useState<RunState>(IDLE);
  const [rightRun, setRightRun] = useState<RunState>(IDLE);

  // AbortControllers for all in-flight streams
  const abortsRef = useRef<AbortController[]>([]);

  // Abort everything on unmount (navigate away)
  useEffect(() => {
    return () => abortsRef.current.forEach((ac) => ac.abort());
  }, []);

  const isRunning =
    leftRun.status === "streaming" || rightRun.status === "streaming";

  // ── Core: start one streaming panel ──────────────────────────────────────
  const runPanel = useCallback(
    (model: string, setter: React.Dispatch<React.SetStateAction<RunState>>) => {
      const ac = new AbortController();
      abortsRef.current.push(ac);
      const t0 = performance.now();

      setter({ ...IDLE, status: "streaming" });

      streamChat(
        { model, messages: [{ role: "user", content: prompt.trim() }] },
        {
          signal: ac.signal,

          onToken(token) {
            // Guard: signal may have fired between the chunk arriving and this call
            if (ac.signal.aborted) return;
            setter((prev) => ({ ...prev, output: prev.output + token }));
          },

          onComplete(usage) {
            if (ac.signal.aborted) return;
            setter((prev) => ({
              ...prev,
              status: "done",
              usage,
              latencyMs: Math.round(performance.now() - t0),
            }));
          },

          onError(err) {
            if (ac.signal.aborted) return;
            setter((prev) => ({ ...prev, status: "error", error: err.message }));
          },
        },
      );
    },
    [prompt],
  );

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!prompt.trim() || isRunning) return;

    // Cancel any leftover streams from a previous Send
    abortsRef.current.forEach((ac) => ac.abort());
    abortsRef.current = [];

    runPanel(leftModel, setLeftRun);
    if (compareMode) runPanel(rightModel, setRightRun);
    else setRightRun(IDLE); // clear right panel if switching out of compare
  }, [prompt, isRunning, compareMode, leftModel, rightModel, runPanel]);

  // ── Stop ─────────────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    abortsRef.current.forEach((ac) => ac.abort());
    abortsRef.current = [];
    // Streams are now cancelled; set streaming panels back to idle so the
    // cursor stops and the Send button re-enables
    setLeftRun((p) => (p.status === "streaming" ? { ...p, status: "idle" } : p));
    setRightRun((p) => (p.status === "streaming" ? { ...p, status: "idle" } : p));
  }, []);

  // Ctrl+Enter / Cmd+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold">Playground</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Test models and compare outputs side by side
          </p>
        </div>

        {/* Compare toggle */}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <span>Compare mode</span>
          <button
            role="switch"
            aria-checked={compareMode}
            onClick={() => setCompare((c) => !c)}
            className={[
              "relative h-5 w-9 rounded-full transition-colors",
              compareMode ? "bg-gray-900" : "bg-gray-200",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                compareMode ? "translate-x-4" : "translate-x-0.5",
              ].join(" ")}
            />
          </button>
        </label>
      </div>

      {/* ── Prompt input ─────────────────────────────────────────────────── */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your prompt… (Ctrl+Enter to send)"
        rows={4}
        className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-gray-400"
      />

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Left model selector (always visible) */}
        <ModelSelect
          value={leftModel}
          onChange={setLeftModel}
          disabled={isRunning}
        />

        {/* Right model selector — only in compare mode */}
        {compareMode && (
          <>
            <span className="text-xs text-gray-400">vs</span>
            <ModelSelect
              value={rightModel}
              onChange={setRightModel}
              disabled={isRunning}
            />
          </>
        )}

        {/* Send / Stop */}
        <div className="ml-auto flex gap-2">
          {isRunning ? (
            <button
              onClick={handleStop}
              className="rounded border border-gray-300 px-4 py-1.5 text-sm transition-colors hover:bg-gray-50"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!prompt.trim()}
              className="rounded bg-gray-900 px-4 py-1.5 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-40"
            >
              Send
            </button>
          )}
        </div>
      </div>

      {/* ── Output panels ─────────────────────────────────────────────────── */}
      <div
        className={[
          "grid gap-4",
          compareMode ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        ].join(" ")}
      >
        <OutputPanel model={leftModel} run={leftRun} />
        {compareMode && <OutputPanel model={rightModel} run={rightRun} />}
      </div>
    </div>
  );
}
