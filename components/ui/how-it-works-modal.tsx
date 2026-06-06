"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  X, KeyRound, ShieldCheck, Terminal, BarChart3,
  Zap, ArrowRight, Layers, RefreshCw,
} from "lucide-react";

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: ShieldCheck,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    title: "Add your provider keys",
    desc: "Paste your own Groq or Gemini API key. We encrypt it with AES-128 and never show it in plaintext again.",
  },
  {
    icon: KeyRound,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    title: "Generate a gateway key",
    desc: "Create a gw_ key for your app. This is what you send — your real provider keys stay encrypted and hidden.",
  },
  {
    icon: Terminal,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    title: "Call the gateway",
    desc: "Point any OpenAI-compatible client at your gateway URL. Same request shape — just change the base URL.",
  },
  {
    icon: BarChart3,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "Monitor everything",
    desc: "Every request is logged with cost, latency, tokens, and which provider served it — all in real time.",
  },
];

const FEATURES = [
  { icon: Layers,    label: "Multi-provider routing" },
  { icon: RefreshCw, label: "Automatic failover" },
  { icon: Zap,       label: "Real-time streaming" },
  { icon: ShieldCheck, label: "Encrypted key storage" },
];

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  // Lock body scroll + close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 pt-6 pb-4 bg-zinc-950/95 backdrop-blur-sm border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-black">G</span>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">How LLM Gateway works</h2>
                  <p className="text-xs text-white/40 mt-0.5">From zero to your first call in 4 steps</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-3">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="flex gap-4"
                >
                  {/* Step number + connector */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-9 h-9 rounded-xl ${step.bg} flex items-center justify-center`}>
                      <step.icon className={`w-4 h-4 ${step.color}`} />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="w-px flex-1 bg-white/[0.08] my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/30">0{i + 1}</span>
                      <p className="text-sm font-semibold text-white">{step.title}</p>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed mt-1">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature chips */}
            <div className="px-6 pb-5">
              <div className="grid grid-cols-2 gap-2">
                {FEATURES.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                  >
                    <f.icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-xs text-white/60">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="sticky bottom-0 px-6 py-4 bg-zinc-950/95 backdrop-blur-sm border-t border-white/[0.06] flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors"
              >
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={onClose}
                className="w-full sm:w-auto text-sm text-white/40 hover:text-white/70 transition-colors py-2.5 px-2"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
